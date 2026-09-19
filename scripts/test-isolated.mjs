// Runs the browser/API suite against disposable H2 services, never local MySQL.
import { spawn, spawnSync } from 'node:child_process'
import { createWriteStream, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createServer } from 'node:net'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const backend = fileURLToPath(new URL('../../be-cafe-manage/', import.meta.url))
const logs = join(frontend, '.logs', 'isolated-tests')
mkdirSync(logs, {recursive:true})
const base = 'http://127.0.0.1:5174'
const env = {...process.env, CAFE_API_BASE_PORT:'8180', CAFE_TEST_BASE_URL:base}
const javaInfo = spawnSync('java', ['-XshowSettings:properties', '-version'], {encoding:'utf8', windowsHide:true})
if (javaInfo.error) throw javaInfo.error
const javaHome = javaInfo.stderr?.match(/java\.home\s*=\s*(.+)/)?.[1].trim()
if (!javaHome) throw new Error('Java 21 is required')
const java = join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
const children = []
async function freePort(port) {
  await new Promise((resolve,reject) => {
    const server=createServer();server.once('error',()=>reject(new Error(`Port ${port} is in use; isolated tests stopped.`)))
    server.listen(port,'127.0.0.1',()=>server.close(resolve))
  })
}
function launch(name, executable, args, cwd) {
  const child = spawn(executable,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']})
  const log = createWriteStream(join(logs, `${name}.log`))
  child.stdout.pipe(log);child.stderr.pipe(log)
  children.push(child)
  child.on('error',error=>console.error(`${name}: ${error.message}`))
  return child
}
async function ready(url) {
  const end = Date.now()+90000
  while(Date.now()<end) {
    try { if((await fetch(url,{signal:AbortSignal.timeout(2000)})).ok)return } catch { /* booting */ }
    if(children.some(p=>p.exitCode!==null))throw new Error(`A test server exited. See ${logs}`)
    await new Promise(resolve=>setTimeout(resolve,500))
  }
  throw new Error(`Timed out waiting for ${url}; see ${logs}`)
}
try {
  for(const port of [5174,8180,8181,8182,8183])await freePort(port)
  for(const [i,name] of ['auth','catalog','pos','permission'].entries()) {
    launch(name,java,['-jar',join(backend,`${name}-service/target/${name}-service-1.0.0.jar`),
      '--spring.profiles.active=local,demo',`--server.port=${8180+i}`,'--server.address=127.0.0.1',
      '--cafe.auth.url=http://127.0.0.1:8180','--cafe.catalog.url=http://127.0.0.1:8181','--cafe.permission.url=http://127.0.0.1:8183'],backend)
  }
  launch('vite',process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174','--strictPort'],frontend)
  console.log('Starting disposable H2 services on 8180–8183 and frontend on 5174...')
  await Promise.all([ready(base),...[8180,8181,8182,8183].map(p=>ready(`http://127.0.0.1:${p}/swagger-ui/index.html`))])
  // Seeding runs after the web server starts; wait for the seeded login too.
  for(let attempt=0;attempt<30;attempt++) {
    const login=await fetch('http://127.0.0.1:8180/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'Cafe@Admin2026'})})
    if(login.ok)break
    if(attempt===29)throw new Error('Demo account was not initialized')
    await new Promise(resolve=>setTimeout(resolve,500))
  }
  const tests=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test',...process.argv.slice(2)],{cwd:frontend,env,windowsHide:true,stdio:'inherit'})
  process.exitCode=await new Promise(resolve=>tests.once('exit',code=>resolve(code??1)))
} finally {
  for(const child of children.reverse()) { if(child.exitCode===null)child.kill() }
}
