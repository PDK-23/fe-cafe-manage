import { DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Order } from '../models/types'
import { dateTime, money, paymentNames } from '../models/api'
import { Modal } from './ui'
import { Printer, CheckCircle2 } from 'lucide-react'
import { Separator } from './ui/separator'
export function Receipt({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal title="Hóa đơn thanh toán" onClose={onClose}>
      <div className="receipt" id="print-receipt">
        <div className="receipt-brand">
          cafe<span>flow.</span>
        </div>
        <p>Cảm ơn bạn đã ghé quán!</p>
        <Separator className="my-4" />
        <h3>HÓA ĐƠN BÁN HÀNG</h3>
        <p>
          CF{String(order.id).padStart(6, '0')} · {order.tableName}
        </p>
        <p>{dateTime(order.paidAt || order.createdAt)}</p>
        <div className="receipt-meta">
          <span>Khách hàng</span>
          <b>{order.customerName || 'Khách lẻ'}</b>
        </div>
        <div className="receipt-meta">
          <span>Thu ngân</span>
          <b>{order.cashier}</b>
        </div>
        <Separator className="my-4" />
        {order.items.map((l, i) => (
          <div className="receipt-line" key={i}>
            <div>
              <b>{l.name}</b>
              <small>
                {l.quantity} × {money(l.price)} {l.note && `· ${l.note}`}
              </small>
            </div>
            <strong>{money(l.quantity * l.price)}</strong>
          </div>
        ))}
        <Separator className="my-4" />
        <div className="receipt-meta">
          <span>Tiền hàng</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="receipt-meta">
          <span>Giảm giá</span>
          <span>−{money(order.discount)}</span>
        </div>
        <div className="receipt-meta">
          <span>Phụ thu</span>
          <span>{money(order.surcharge)}</span>
        </div>
        <div className="receipt-total">
          <b>Tổng thanh toán</b>
          <b>{money(order.total)}</b>
        </div>
        <div className="receipt-meta">
          <span>{paymentNames[order.paymentMethod]}</span>
          <span>{money(order.tendered)}</span>
        </div>
        <div className="receipt-meta">
          <span>Tiền thừa</span>
          <span>{money(order.change)}</span>
        </div>
        {order.note && <p>{order.note}</p>}
        <div className="paid-stamp">
          <CheckCircle2 size={16} /> ĐÃ THANH TOÁN
        </div>
      </div>
      <DialogFooter className="modal-actions">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button variant="default" onClick={() => window.print()}>
          <Printer size={17} />
          In hóa đơn
        </Button>
      </DialogFooter>
    </Modal>
  )
}
