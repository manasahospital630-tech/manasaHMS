import React, { useState, useEffect } from 'react';
import { ShoppingCart, Printer, Search, Calendar, DollarSign, Users, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { getHospitalLogoHtml } from '../../utils/logoHelper';

interface SaleInvoice {
  invoice_id: string;
  total_amount: string;
  discount: string;
  tax: string;
  payment_method: string;
  created_at: string;
  notes: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_mrn: string;
  pharmacist_first_name: string;
  pharmacist_last_name: string;
  pharmacist_email: string;
}

interface StatsGroup {
  count: number;
  amount: number;
  byMethod: {
    UPI: { count: number; amount: number };
    Card: { count: number; amount: number };
    Cash: { count: number; amount: number };
    Insurance: { count: number; amount: number };
    'Bank Transfer': { count: number; amount: number };
  };
}

interface DashboardStats {
  day: StatsGroup;
  week: StatsGroup;
  month: StatsGroup;
}

const numberToWords = (num: number): string => {
  const rounded = Math.round(num);
  if (rounded === 0) return 'RUPEES ZERO ONLY';
  const a = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  const chunk = (n: number) => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let cleanNum = rounded;
  let word = '';
  
  if (cleanNum >= 10000000) {
    word += chunk(Math.floor(cleanNum / 10000000)) + ' CRORE ';
    cleanNum %= 10000000;
  }
  if (cleanNum >= 100000) {
    word += chunk(Math.floor(cleanNum / 100000)) + ' LAKH ';
    cleanNum %= 100000;
  }
  if (cleanNum >= 1000) {
    word += chunk(Math.floor(cleanNum / 1000)) + ' THOUSAND ';
    cleanNum %= 1000;
  }
  if (cleanNum > 0) {
    word += chunk(cleanNum);
  }
  
  return 'RUPEES ' + word.trim().replace(/\s+/g, ' ') + ' ONLY';
};

const emptyMethodStats = {
  UPI: { count: 0, amount: 0 },
  Card: { count: 0, amount: 0 },
  Cash: { count: 0, amount: 0 },
  Insurance: { count: 0, amount: 0 },
  'Bank Transfer': { count: 0, amount: 0 }
};
const emptyStatsGroup = { count: 0, amount: 0, byMethod: emptyMethodStats };

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    day: emptyStatsGroup,
    week: emptyStatsGroup,
    month: emptyStatsGroup
  });
  const [loading, setLoading] = useState(false);
  const [hospitalDetails, setHospitalDetails] = useState<any>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacy/sales');
      if (res.data.success && res.data.data) {
        setSales(res.data.data.sales || []);
        setStats(res.data.data.stats || {
          day: emptyStatsGroup,
          week: emptyStatsGroup,
          month: emptyStatsGroup
        });
      }
    } catch (err) {
      console.error('Failed to fetch sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();

    api.get('/admin/hospital-settings')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setHospitalDetails(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handlePrint = async (invoiceId: string) => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}`);
      if (res.data.success && res.data.data) {
        const fullInvoice = res.data.data;
        const patientDetails = {
          first_name: fullInvoice.first_name,
          last_name: fullInvoice.last_name,
          phone: fullInvoice.phone,
          address: fullInvoice.address,
          medical_record_number: fullInvoice.medical_record_number
        };

        const mappedItems = (fullInvoice.items || []).map((item: any) => ({
          itemName: item.description,
          genericName: item.composition,
          hsnCode: item.hsn_code,
          batchNo: item.batch_no,
          expiryDate: item.expiry_date,
          quantity: item.quantity,
          unitLabel: item.unit,
          chargePrice: parseFloat(item.unit_price),
          discount: parseFloat(item.discount || 0),
        }));

        printReceipt(fullInvoice, patientDetails, mappedItems);
      }
    } catch (err) {
      alert('Failed to retrieve invoice items for printing.');
    }
  };

  const printReceipt = (invoice: any, patientInfo: any, items: any[]) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    const getBillNo = (id: string, dateStr: string) => {
      if (!id) return 'PH-TEMP';
      const date = new Date(dateStr || Date.now());
      const year = String(date.getFullYear()).slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const shortId = id.slice(0, 4).toUpperCase();
      return `PH${year}${month}-${shortId}`;
    };

    const itemRows = items.map((item, idx) => {
      const rowMRP = item.chargePrice;
      const rowDiscount = item.discount || 0;
      const rowRate = rowMRP - rowDiscount;
      const rowAmount = rowRate * item.quantity;
      const expiryFormatted = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '—';
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${item.itemName}</strong></td>
          <td>${item.genericName || '—'}</td>
          <td style="text-align: center;">${item.hsnCode || '30049099'}</td>
          <td>${item.batchNo || '—'}</td>
          <td style="text-align: center;">${expiryFormatted}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: center;">${item.unitLabel}</td>
          <td class="text-right">₹${rowMRP.toFixed(2)}</td>
          <td class="text-right">₹${rowDiscount.toFixed(2)}</td>
          <td class="text-right">₹${rowRate.toFixed(2)}</td>
          <td class="text-right"><strong>₹${rowAmount.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join('');

    const totalMRP = items.reduce((acc, x) => acc + x.chargePrice * x.quantity, 0);
    const totalDiscountVal = items.reduce((acc, x) => acc + (x.discount || 0) * x.quantity, 0);
    const taxableAmt = totalMRP - totalDiscountVal;
    const cgstVal = taxableAmt * 0.025;
    const sgstVal = taxableAmt * 0.025;
    const totalGST = cgstVal + sgstVal;
    const grandTotal = taxableAmt + totalGST;
    const totalQty = items.reduce((acc, x) => acc + x.quantity, 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Pharmacy Bill - ${getBillNo(invoice.invoice_id, invoice.created_at)}</title>
          <style>
            @media print {
              .no-print { display: none; }
              body { margin: 0; padding: 0; background: none; }
              .invoice-card { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 11px;
              color: #333;
              line-height: 1.4;
              background-color: #f3f4f6;
              padding: 30px 15px;
            }
            .invoice-card {
              max-width: 850px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 30px;
              background: #fff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              border-radius: 8px;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .header-logo {
              width: 20%;
              vertical-align: middle;
            }
            .header-center {
              text-align: center;
              width: 60%;
              vertical-align: middle;
            }
            .header-center h1 {
              margin: 0 0 4px 0;
              font-size: 20px;
              font-weight: 800;
              color: #111;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header-center p {
              margin: 2px 0;
              font-size: 10.5px;
              color: #555;
            }
            .header-stamp {
              width: 20%;
              text-align: right;
              vertical-align: middle;
            }
            .stamp-box {
              display: inline-block;
              border: 1.5px dashed #2563eb;
              color: #2563eb;
              padding: 6px 12px;
              font-family: 'Courier New', Courier, monospace;
              font-weight: bold;
              font-size: 11px;
              transform: rotate(-3deg);
              border-radius: 4px;
              background: #f0f4ff;
            }
            .title-block {
              text-align: center;
              border-top: 3px double #333;
              border-bottom: 3px double #333;
              margin: 15px 0;
              padding: 5px 0;
            }
            .title-block h2 {
              margin: 0;
              font-size: 14px;
              color: #166534;
              letter-spacing: 3px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .meta-table td {
              padding: 4px 0;
              vertical-align: top;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 10px;
            }
            .items-table th {
              border-top: 3px double #333;
              border-bottom: 3px double #333;
              text-align: left;
              padding: 8px 4px;
              font-weight: 700;
              background-color: #fafafa;
              text-transform: uppercase;
            }
            .items-table td {
              border-bottom: 1px dotted #ccc;
              padding: 7px 4px;
              vertical-align: middle;
            }
            .text-right {
              text-align: right;
            }
            .totals-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 15px;
              gap: 20px;
            }
            .rx-box {
              border: 1px solid #166534;
              border-radius: 4px;
              background: #f0fdf4;
              padding: 10px 14px;
              max-width: 48%;
              font-size: 10.5px;
              color: #166534;
              display: flex;
              align-items: flex-start;
              gap: 10px;
              line-height: 1.5;
            }
            .rx-box strong {
              font-size: 22px;
              line-height: 1;
              color: #166534;
            }
            .count-box {
              font-size: 10px;
              color: #666;
              margin-top: 10px;
              border-top: 1px solid rgba(22,101,52,0.15);
              padding-top: 6px;
            }
            .totals-table {
              width: 330px;
              border-collapse: collapse;
              font-size: 11px;
            }
            .totals-table td {
              padding: 4px 6px;
            }
            .grand-total-row {
              background-color: #166534;
              color: #fff;
              font-weight: bold;
              font-size: 13px;
            }
            .grand-total-row td {
              padding: 8px;
            }
            .words-box {
              border-top: 1px solid #ddd;
              border-bottom: 1px solid #ddd;
              padding: 8px 4px;
              margin: 15px 0;
              font-weight: bold;
              font-style: italic;
              font-size: 10.5px;
              color: #444;
              text-transform: uppercase;
            }
            .footer-table {
              width: 100%;
              margin-top: 40px;
              font-size: 11px;
            }
            .footer-table td {
              vertical-align: bottom;
            }
            .sign-line {
              border-top: 1px solid #333;
              width: 160px;
              margin-top: 40px;
              text-align: center;
              padding-top: 4px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <!-- Header Section -->
            <table class="header-table">
              <tr>
                <td class="header-logo">
                  ${getHospitalLogoHtml(hospitalDetails?.hospital_logo, 60)}
                </td>
                <td class="header-center">
                  <h1>${hospitalDetails?.hospital_name || 'MANASA HOSPITAL'}</h1>
                  <p>${hospitalDetails?.hospital_address || 'Market Lane, Narsingi, Gandipet Mandal Rangareddy Dist - 500089'}</p>
                  <p>Phone: ${hospitalDetails?.phone_number || 'Ph: 7386301348'} | Web: ${hospitalDetails?.website || 'www.manasahospital.co.in'} | Email: ${hospitalDetails?.email || 'info@manasahospital.co.in'}</p>
                  ${hospitalDetails?.gstin ? `<p style="margin-top: 4px;"><strong>GSTIN: ${hospitalDetails.gstin}</strong></p>` : ''}
                </td>
              </tr>
            </table>

            <!-- Title Block -->
            <div class="title-block">
              <h2>Pharmacy Bill</h2>
            </div>

            <!-- Meta Data Grid -->
            <table class="meta-table">
              <tr>
                <td style="width: 15%;"><strong>Bill No</strong></td>
                <td style="width: 35%;">: ${getBillNo(invoice.invoice_id, invoice.created_at)}</td>
                <td style="width: 18%;"><strong>Invoice No</strong></td>
                <td style="width: 32%;">: IN-${invoice.invoice_id.substring(24, 30).toUpperCase()}</td>
              </tr>
              <tr>
                <td><strong>Date</strong></td>
                <td>: ${new Date(invoice.created_at || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                <td><strong>Customer Name</strong></td>
                <td>: ${patientInfo ? `${patientInfo.first_name} ${patientInfo.last_name}` : 'Walk-in'}</td>
              </tr>
              <tr>
                <td><strong>Invoice Type</strong></td>
                <td>: Pharmacy Sale</td>
                <td><strong>Mobile</strong></td>
                <td>: ${patientInfo?.phone || '—'}</td>
              </tr>
              <tr>
                <td><strong>Payment Type</strong></td>
                <td>: ${invoice.payment_method}</td>
                <td><strong>Address</strong></td>
                <td>: ${patientInfo?.address || '—'}</td>
              </tr>
            </table>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">S.No</th>
                  <th style="width: 25%;">Medicine Name</th>
                  <th style="width: 20%;">Composition</th>
                  <th style="width: 10%; text-align: center;">HSN Code</th>
                  <th style="width: 10%;">Batch No.</th>
                  <th style="width: 8%; text-align: center;">Expiry</th>
                  <th style="width: 5%; text-align: center;">Qty</th>
                  <th style="width: 8%; text-align: center;">Unit</th>
                  <th style="width: 8%;" class="text-right">MRP (₹)</th>
                  <th style="width: 8%;" class="text-right">Disc (₹)</th>
                  <th style="width: 8%;" class="text-right">Rate (₹)</th>
                  <th style="width: 10%;" class="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- Totals & Prescription notes -->
            <div class="totals-container">
              <div class="rx-box">
                <strong>R<sub>x</sub></strong>
                <div>
                  Thank you for choosing ${hospitalDetails?.hospital_name ? (hospitalDetails.hospital_name.toLowerCase().includes('pharmacy') ? hospitalDetails.hospital_name : `${hospitalDetails.hospital_name} Pharmacy`) : 'MANASA HOSPITAL Pharmacy'}. Please consult your physician before taking any medicine.
                  <div class="count-box">
                    TOTAL ITEMS: <strong>${items.length}</strong> | TOTAL QTY: <strong>${totalQty}</strong>
                  </div>
                </div>
              </div>
              
              <table class="totals-table">
                <tr>
                  <td>Total Amount</td>
                  <td class="text-right">₹${totalMRP.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Discount</td>
                  <td class="text-right">-₹${totalDiscountVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Taxable Amount</td>
                  <td class="text-right">₹${taxableAmt.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>CGST (2.5%)</td>
                  <td class="text-right">₹${cgstVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST (2.5%)</td>
                  <td class="text-right">₹${sgstVal.toFixed(2)}</td>
                </tr>
                <tr class="grand-total-row">
                  <td>GRAND TOTAL</td>
                  <td class="text-right">₹${grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Words Box -->
            <div class="words-box">
              Amount in words: ${numberToWords(grandTotal)}
            </div>

            <!-- Footer & Signatures -->
            <table class="footer-table">
              <tr>
                <td style="width: 33%;">
                  <div style="font-weight: bold; display: flex; align-items: center; gap: 4px;">
                    👤 Prepared By: ${invoice.prepared_by || 'system admin'}
                  </div>
                </td>
                <td style="width: 34%; text-align: center; font-weight: bold; color: #166534; font-size: 11px;">
                  🌿 Thank you! Visit Again!! 🌿
                </td>
                <td style="width: 33%; text-align: right;">
                  <div class="sign-line" style="margin-left: auto;">
                    Authorised Signatory
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Print button for interactive mode -->
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 12px 30px; font-size: 14px; font-weight: bold; background: #166534; color: #fff; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🖨️ Print Receipt</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getBillNo = (id: string, dateStr: string) => {
    if (!id) return 'PH-TEMP';
    const date = new Date(dateStr || Date.now());
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = id.slice(0, 4).toUpperCase();
    return `PH${year}${month}-${shortId}`;
  };

  // Filter list
  const filteredSales = sales.filter((sale) => {
    // 1. Text Search (patient details or pharmacist name)
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const patientName = `${sale.patient_first_name || ''} ${sale.patient_last_name || ''}`.toLowerCase();
      const pharmacistName = `${sale.pharmacist_first_name || ''} ${sale.pharmacist_last_name || ''}`.toLowerCase();
      const matchText = 
        patientName.includes(q) ||
        pharmacistName.includes(q) ||
        (sale.patient_phone || '').includes(q) ||
        (sale.patient_mrn || '').toLowerCase().includes(q) ||
        (sale.payment_method || '').toLowerCase().includes(q) ||
        getBillNo(sale.invoice_id, sale.created_at).toLowerCase().includes(q);
      
      if (!matchText) return false;
    }

    // 2. Date Filter
    if (dateFilter !== 'All') {
      const saleDate = new Date(sale.created_at);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (dateFilter === 'Today' && saleDate < startOfDay) return false;
      if (dateFilter === 'Week' && saleDate < startOfWeek) return false;
      if (dateFilter === 'Month' && saleDate < startOfMonth) return false;
    }

    // 3. Payment Filter
    if (paymentFilter !== 'All') {
      if (sale.payment_method !== paymentFilter) return false;
    }

    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1>
          <ShoppingCart size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Pharmacy Sales History
        </h1>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchSalesData} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Mini Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <Card title="Today's Sales" style={{ background: 'linear-gradient(135deg, rgba(22,101,52,0.15) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(22,101,52,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-success)', margin: '8px 0 4px 0' }}>
            {formatCurrency(stats.day.amount)}
          </div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Total Invoices: <strong>{stats.day.count}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>📱 UPI ({stats.day.byMethod?.UPI?.count || 0})</span>
              <strong>{formatCurrency(stats.day.byMethod?.UPI?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>💳 Card ({stats.day.byMethod?.Card?.count || 0})</span>
              <strong>{formatCurrency(stats.day.byMethod?.Card?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>💵 Cash ({stats.day.byMethod?.Cash?.count || 0})</span>
              <strong>{formatCurrency(stats.day.byMethod?.Cash?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🏥 Insurance ({stats.day.byMethod?.Insurance?.count || 0})</span>
              <strong>{formatCurrency(stats.day.byMethod?.Insurance?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🏦 Bank Transfer ({stats.day.byMethod?.['Bank Transfer']?.count || 0})</span>
              <strong>{formatCurrency(stats.day.byMethod?.['Bank Transfer']?.amount || 0)}</strong>
            </div>
          </div>
        </Card>

        <Card title="Weekly Sales" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(14,165,233,0.2)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-info)', margin: '8px 0 4px 0' }}>
            {formatCurrency(stats.week.amount)}
          </div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Total Invoices: <strong>{stats.week.count}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>📱 UPI ({stats.week.byMethod?.UPI?.count || 0})</span>
              <strong>{formatCurrency(stats.week.byMethod?.UPI?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>💳 Card ({stats.week.byMethod?.Card?.count || 0})</span>
              <strong>{formatCurrency(stats.week.byMethod?.Card?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>💵 Cash ({stats.week.byMethod?.Cash?.count || 0})</span>
              <strong>{formatCurrency(stats.week.byMethod?.Cash?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🏥 Insurance ({stats.week.byMethod?.Insurance?.count || 0})</span>
              <strong>{formatCurrency(stats.week.byMethod?.Insurance?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🏦 Bank Transfer ({stats.week.byMethod?.['Bank Transfer']?.count || 0})</span>
              <strong>{formatCurrency(stats.week.byMethod?.['Bank Transfer']?.amount || 0)}</strong>
            </div>
          </div>
        </Card>

        <Card title="Monthly Sales" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-warning)', margin: '8px 0 4px 0' }}>
            {formatCurrency(stats.month.amount)}
          </div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Total Invoices: <strong>{stats.month.count}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>📱 UPI ({stats.month.byMethod?.UPI?.count || 0})</span>
              <strong>{formatCurrency(stats.month.byMethod?.UPI?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>💳 Card ({stats.month.byMethod?.Card?.count || 0})</span>
              <strong>{formatCurrency(stats.month.byMethod?.Card?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>💵 Cash ({stats.month.byMethod?.Cash?.count || 0})</span>
              <strong>{formatCurrency(stats.month.byMethod?.Cash?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🏥 Insurance ({stats.month.byMethod?.Insurance?.count || 0})</span>
              <strong>{formatCurrency(stats.month.byMethod?.Insurance?.amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🏦 Bank Transfer ({stats.month.byMethod?.['Bank Transfer']?.count || 0})</span>
              <strong>{formatCurrency(stats.month.byMethod?.['Bank Transfer']?.amount || 0)}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters & Search" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', marginBottom: 6, color: 'var(--text-secondary)' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search patient, MRN, phone, salesperson..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', fontSize: 'var(--font-sm)',
                  border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div>
            <Select
              label="Date Range"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'All', label: '🗓️ All Sales' },
                { value: 'Today', label: '📅 Today' },
                { value: 'Week', label: '🗓️ This Week' },
                { value: 'Month', label: '🗓️ This Month' }
              ]}
            />
          </div>
          <div>
            <Select
              label="Payment Method"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              options={[
                { value: 'All', label: '💳 All Methods' },
                { value: 'Cash', label: '💵 Cash' },
                { value: 'Card', label: '💳 Card' },
                { value: 'UPI', label: '📱 UPI' },
                { value: 'Insurance', label: '🏥 Insurance' },
                { value: 'Bank Transfer', label: '🏦 Bank Transfer' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Sales List Table */}
      <Card title={`Pharmacy Invoices (${filteredSales.length} records)`}>
        {filteredSales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No sales records match the selected filters.
          </div>
        ) : (
          <Table
            columns={[
              {
                key: 'billNo',
                label: 'Bill No',
                render: (_, row) => (
                  <strong style={{ color: 'var(--primary)' }}>
                    {getBillNo(row.invoice_id, row.created_at)}
                  </strong>
                )
              },
              {
                key: 'created_at',
                label: 'Date & Time',
                render: (v) => new Date(v).toLocaleString('en-IN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: true
                })
              },
              {
                key: 'patient',
                label: 'Patient details',
                render: (_, row) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.patient_first_name} {row.patient_last_name}</div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>MRN: {row.patient_mrn}</span>
                  </div>
                )
              },
              {
                key: 'salesperson',
                label: 'Salesperson (Pharmacist)',
                render: (_, row) => {
                  const firstName = row.pharmacist_first_name || '';
                  const lastName = row.pharmacist_last_name || 'System';
                  const email = row.pharmacist_email ? ` (${row.pharmacist_email})` : '';
                  return (
                    <span style={{ fontSize: 'var(--font-sm)' }}>
                      <strong>{firstName} {lastName}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>{email}</span>
                    </span>
                  );
                }
              },
              {
                key: 'payment_method',
                label: 'Method',
                render: (v) => {
                  let emoji = '💳';
                  if (v === 'Cash') emoji = '💵';
                  if (v === 'UPI') emoji = '📱';
                  if (v === 'Insurance') emoji = '🏥';
                  return <Badge variant="default">{emoji} {v}</Badge>;
                }
              },
              {
                key: 'total_amount',
                label: 'Total Sale',
                render: (v) => <strong style={{ color: 'var(--accent-success)' }}>{formatCurrency(parseFloat(v))}</strong>
              },
              {
                key: 'actions',
                label: 'Action',
                render: (_, row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Printer size={14} />}
                    onClick={() => handlePrint(row.invoice_id)}
                  >
                    Print
                  </Button>
                )
              }
            ]}
            data={filteredSales}
          />
        )}
      </Card>
    </div>
  );
};

export default SalesHistory;
