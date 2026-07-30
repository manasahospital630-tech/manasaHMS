import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Trash2, IndianRupee, Printer, CheckCircle, Layers, Search, UserPlus, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PatientSearchBar } from '../../components/shared/PatientSearchBar';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { getHospitalLogoHtml } from '../../utils/logoHelper';
import SalesHistory from './SalesHistory';

interface SelectedItem {
  itemId: string;
  itemName: string;
  sku: string;
  stockQuantity: number;
  sheetPrice: number;      // price per sheet/unit
  isSheet: boolean;
  tabletsPerSheet: number;
  sellLoose: boolean;       // true = selling individual tablets
  quantity: number;         // number of sheets (if !sellLoose) or tablets (if sellLoose)
  chargePrice: number;      // computed price used for billing
  unitLabel: string;        // e.g. "Sheet", "Tablets", "Unit", "Bottle"
  category: string;
  genericName?: string;
  batchNo?: string;
  expiryDate?: string;
  hsnCode?: string;
  discount: number;        // itemized discount amount (per unit)
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

const MedicineSales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'history'>('sales');
  const [patient, setPatient] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [sellLoose, setSellLoose] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const itemSearchRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Post-sale receipt state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [lastPatient, setLastPatient] = useState<any>(null);
  const [lastItems, setLastItems] = useState<SelectedItem[]>([]);

  // Hospital settings
  const [hospitalDetails, setHospitalDetails] = useState<any>(null);

  // Quick Patient Registration Modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    ageMonths: '',
    gender: 'Male',
    patientCategory: 'Adult',
    phone: '',
    bloodGroup: '',
    address: '',
    referredBy: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handleQuickPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      const formattedAge = regForm.patientCategory === 'Child'
        ? (regForm.age ? `${regForm.age} Years ${regForm.ageMonths || '0'} Months` : `${regForm.ageMonths || '0'} Months`)
        : `${regForm.age} Years`;

      const payload = {
        ...regForm,
        age: formattedAge
      };

      const res = await api.post('/patients', payload);
      if (res.data.success && res.data.data) {
        setPatient(res.data.data);
        setShowPatientModal(false);
        setRegForm({
          firstName: '', lastName: '', age: '', ageMonths: '', gender: 'Male',
          patientCategory: 'Adult', phone: '', bloodGroup: '', address: '', referredBy: ''
        });
      }
    } catch (err: any) {
      setRegError(err.response?.data?.error || 'Failed to register patient.');
    } finally {
      setRegLoading(false);
    }
  };

  // Fetch inventory items & hospital settings on mount
  useEffect(() => {
    api.get('/pharmacy/inventory?limit=200')
      .then((r) => setInventory(r.data.data.items || []))
      .catch(() => {});
    
    api.get('/admin/hospital-settings')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setHospitalDetails(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Click-outside to close item search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemSearchRef.current && !itemSearchRef.current.contains(e.target as Node)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter inventory based on search text
  const filteredInventory = inventory.filter((m) => {
    if (!itemSearch.trim()) return true;
    const q = itemSearch.toLowerCase();
    return (
      (m.item_name || '').toLowerCase().includes(q) ||
      (m.generic_name || '').toLowerCase().includes(q) ||
      (m.batch_no || '').toLowerCase().includes(q) ||
      (m.sku || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q)
    );
  });

  // When selected medicine changes, determine if sell-loose toggle should be available
  const selectedInvItem = inventory.find(x => x.item_id === selectedMedicineId);

  const getUnitLabel = (item: any, loose: boolean, qty: number): string => {
    if (loose && item.is_sheet) return qty === 1 ? 'Tablet' : 'Tablets';
    const cat = (item.category || '').toLowerCase();
    if (item.is_sheet) return qty === 1 ? 'Sheet' : 'Sheets';
    if (cat.includes('syrup')) return qty === 1 ? 'Bottle' : 'Bottles';
    if (cat.includes('injection')) return qty === 1 ? 'Vial' : 'Vials';
    if (cat.includes('skin')) return qty === 1 ? 'Tube' : 'Tubes';
    return qty === 1 ? 'Unit' : 'Units';
  };

  const getChargePrice = (item: any, loose: boolean): number => {
    const sheetPrice = parseFloat(item.unit_price);
    if (loose && item.is_sheet) {
      const tps = parseInt(item.tablets_per_sheet, 10) || 1;
      return parseFloat((sheetPrice / tps).toFixed(2));
    }
    return sheetPrice;
  };

  const handleAddMedicine = () => {
    if (!selectedMedicineId || !selectedInvItem) return;

    const qty = parseInt(saleQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid quantity.');
      return;
    }

    const item = selectedInvItem;
    const tps = parseInt(item.tablets_per_sheet, 10) || 1;
    const availableStock = parseFloat(item.stock_quantity);
    const isLoose = sellLoose && item.is_sheet;

    // Stock check: if selling loose, convert tablets to sheets for stock comparison
    const stockNeeded = isLoose ? qty / tps : qty;
    if (availableStock < stockNeeded) {
      const availUnits = isLoose ? Math.floor(availableStock * tps) : availableStock;
      setErrorMsg(`Insufficient stock for ${item.item_name}. Only ${availUnits} ${isLoose ? 'tablets' : 'units'} available.`);
      return;
    }

    const chargePrice = getChargePrice(item, isLoose);
    const unitLabel = getUnitLabel(item, isLoose, qty);

    // Check if same item with same sell mode already added
    const existingIndex = selectedItems.findIndex(x => x.itemId === item.item_id && x.sellLoose === isLoose);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      const newQty = updated[existingIndex].quantity + qty;
      const newStockNeeded = isLoose ? newQty / tps : newQty;
      if (availableStock < newStockNeeded) {
        setErrorMsg(`Cannot add more. Exceeds available stock.`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].unitLabel = getUnitLabel(item, isLoose, newQty);
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          itemId: item.item_id,
          itemName: item.item_name,
          sku: item.sku,
          stockQuantity: availableStock,
          sheetPrice: parseFloat(item.unit_price),
          isSheet: item.is_sheet,
          tabletsPerSheet: tps,
          sellLoose: isLoose,
          quantity: qty,
          chargePrice,
          unitLabel,
          category: item.category,
          genericName: item.generic_name,
          batchNo: item.batch_no,
          expiryDate: item.expiry_date,
          hsnCode: item.hsn_code || '30049099',
          discount: 0,
        },
      ]);
    }

    setSelectedMedicineId('');
    setSaleQuantity('1');
    setSellLoose(false);
    setItemSearch('');
    setErrorMsg('');
  };

  const handleRemoveItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleQtyChange = (idx: number, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return;
    const updated = [...selectedItems];
    const si = updated[idx];
    const invItem = inventory.find(x => x.item_id === si.itemId);
    if (!invItem) return;
    const tps = si.tabletsPerSheet;
    const stockNeeded = si.sellLoose ? qty / tps : qty;
    if (parseFloat(invItem.stock_quantity) < stockNeeded) {
      alert(`Cannot set quantity. Exceeds available stock.`);
      return;
    }
    updated[idx] = { ...si, quantity: qty, unitLabel: getUnitLabel(invItem, si.sellLoose, qty) };
    setSelectedItems(updated);
  };

  const handleDiscountChange = (idx: number, discountStr: string) => {
    const val = parseFloat(discountStr);
    if (isNaN(val) || val < 0) return;
    const updated = [...selectedItems];
    const si = updated[idx];
    if (val > si.chargePrice) {
      alert('Discount cannot be greater than MRP');
      return;
    }
    updated[idx] = { ...si, discount: val };
    setSelectedItems(updated);
  };

  // Calculations
  const itemTotal = selectedItems.reduce((acc, x) => acc + x.chargePrice * x.quantity, 0);
  const totalDiscount = selectedItems.reduce((acc, x) => acc + (x.discount || 0) * x.quantity, 0);
  const taxableAmount = itemTotal - totalDiscount;
  const cgst = taxableAmount * 0.025; // 2.5%
  const sgst = taxableAmount * 0.025; // 2.5%
  const tax = cgst + sgst;            // 5% GST
  const total = taxableAmount + tax;

  const handleRecordSale = async () => {
    if (!patient) {
      setErrorMsg('Please select a patient first.');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMsg('Please add at least one item.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        patientId: patient.patient_id,
        paymentMethod,
        items: selectedItems.map(x => ({
          itemId: x.itemId,
          quantity: x.quantity,
          sellLoose: x.sellLoose,
          discount: x.discount || 0,
        })),
      };

      const res = await api.post('/pharmacy/sales', payload);
      if (res.data.success) {
        setLastInvoice(res.data.data);
        setLastPatient(patient);
        setLastItems([...selectedItems]);
        setShowReceiptModal(true);

        setSelectedItems([]);
        setPatient(null);
        // Refresh inventory levels
        const invRes = await api.get('/pharmacy/inventory?limit=200');
        setInventory(invRes.data.data.items || []);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to record sales transaction.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Receipt Printing ───
  const printReceipt = (invoice: any, patientInfo: any, items: SelectedItem[]) => {
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
                  <th style="width: 6%;">S.NO</th>
                  <th style="width: 24%;">MEDICINE NAME</th>
                  <th style="width: 20%;">COMPOSITION</th>
                  <th style="width: 10%;">HSN CODE</th>
                  <th style="width: 14%;">BATCH NO.</th>
                  <th style="width: 10%;">EXPIRY</th>
                  <th style="width: 6%;" class="text-center">QTY</th>
                  <th style="width: 8%;">UNIT</th>
                  <th style="width: 10%;" class="text-right">MRP (₹)</th>
                  <th style="width: 8%;" class="text-right">DISC (₹)</th>
                  <th style="width: 8%;" class="text-right">RATE (₹)</th>
                  <th style="width: 10%;" class="text-right">AMOUNT (₹)</th>
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

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <h1><ShoppingCart size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Medicine Sales</h1>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '10px 20px',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            background: activeTab === 'sales' ? 'rgba(14,165,233,0.08)' : 'transparent',
            color: activeTab === 'sales' ? 'var(--primary)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'sales' ? '2px solid var(--primary)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0'
          }}
        >
          🛒 Medicine Sales Checkout
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            background: activeTab === 'history' ? 'rgba(14,165,233,0.08)' : 'transparent',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0'
          }}
        >
          📋 Sales History & Dashboard
        </button>
      </div>

      {activeTab === 'sales' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Patient Selection */}
          <Card title="1. Select Patient" style={{ position: 'relative', zIndex: 50 }}>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <PatientSearchBar
                    onSelect={(p) => setPatient(p)}
                    showRegisterOption={true}
                    onRegisterClick={() => setShowPatientModal(true)}
                  />
                </div>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowPatientModal(true)}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={16} /> + Quick Register OP Patient
                </Button>
              </div>
              {patient && (
                <div style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--primary)' }}>Patient Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs) var(--space-md)', fontSize: 'var(--font-sm)' }}>
                    <div><strong>Name:</strong> {patient.first_name} {patient.last_name}</div>
                    <div><strong>MRN:</strong> {patient.medical_record_number}</div>
                    <div><strong>DOB:</strong> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-IN') : '—'}</div>
                    <div><strong>Gender:</strong> {patient.gender || '—'}</div>
                    <div><strong>Phone:</strong> {patient.phone || '—'}</div>
                    <div><strong>Address:</strong> {patient.address || '—'}</div>
                    <div><strong>Blood Group:</strong> {patient.blood_group || '—'}</div>
                    <div><strong>Referred By:</strong> <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{patient.referred_by || '—'}</span></div>
                    <div><strong>Assigned Doctor:</strong> {patient.doctor_first_name ? `Dr. ${patient.doctor_first_name} ${patient.doctor_last_name}` : 'None'}</div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Allergies:</strong> <span style={{ color: patient.allergies && patient.allergies.toLowerCase() !== 'none' ? 'var(--danger)' : 'inherit' }}>{patient.allergies || 'None'}</span></div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Items Selector & List */}
          <Card title="2. Add Items to Basket" style={{ position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'grid', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div className="form-row" style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
                <div style={{ flex: 2, position: 'relative' }} ref={itemSearchRef}>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Search Item *</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search by name, generic name, batch no..."
                      value={itemSearch}
                      onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                      onFocus={() => setShowItemDropdown(true)}
                      style={{
                        width: '100%', padding: '10px 12px 10px 36px', fontSize: 'var(--font-sm)',
                        border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {selectedInvItem && (
                    <div style={{ marginTop: 4, padding: '6px 10px', background: 'rgba(14,165,233,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>✅ <strong>{selectedInvItem.item_name}</strong> — {selectedInvItem.category} — Stock: {parseFloat(selectedInvItem.stock_quantity)} {selectedInvItem.is_sheet ? 'sheets' : 'units'}</span>
                      <button type="button" onClick={() => { setSelectedMedicineId(''); setItemSearch(''); setSellLoose(false); }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>✕</button>
                    </div>
                  )}
                  {/* Searchable Dropdown */}
                  {showItemDropdown && !selectedMedicineId && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                      maxHeight: 280, overflowY: 'auto',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      marginTop: 4,
                    }}>
                      {filteredInventory.length === 0 ? (
                        <div style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>No items found</div>
                      ) : filteredInventory.map((m) => (
                        <div key={m.item_id}
                          onClick={() => {
                            setSelectedMedicineId(m.item_id);
                            setItemSearch(m.item_name);
                            setShowItemDropdown(false);
                            setSellLoose(false);
                          }}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(14,165,233,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{m.item_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', gap: 12 }}>
                            <span>Generic: {m.generic_name || '—'}</span>
                            <span>Batch: {m.batch_no || '—'}</span>
                            <span>HSN: {m.hsn_code || '30049099'}</span>
                            <span style={{ marginLeft: 'auto', color: parseFloat(m.stock_quantity) <= m.reorder_level ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 600 }}>
                              Stock: {parseFloat(m.stock_quantity)} {m.is_sheet ? 'sheets' : 'units'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Input label="Quantity" type="number" min="1" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} />
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={handleAddMedicine}>Add</Button>
              </div>

              {/* Sell Loose Toggle — only for sheet items */}
              {selectedInvItem && selectedInvItem.is_sheet && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(14,165,233,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(14,165,233,0.15)' }}>
                  <Layers size={16} style={{ color: 'var(--accent-info)' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                    <input type="checkbox" checked={sellLoose} onChange={e => setSellLoose(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }} />
                    Sell Loose Tablets (individual)
                  </label>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Sheet: {formatCurrency(parseFloat(selectedInvItem.unit_price))} / {selectedInvItem.tablets_per_sheet} tab
                    {' → '}
                    Per Tablet: <strong style={{ color: 'var(--accent-success)' }}>{formatCurrency(parseFloat(selectedInvItem.unit_price) / (parseInt(selectedInvItem.tablets_per_sheet, 10) || 1))}</strong>
                  </span>
                </div>
              )}

              {errorMsg && (
                <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>

            {/* Basket Table */}
            {selectedItems.length > 0 && (
              <Table
                columns={[
                  { key: 'itemName', label: 'Item Name' },
                  { key: 'unitLabel', label: 'Type', render: (v, row) => (
                    <Badge variant={row.sellLoose ? 'warning' : 'default'} style={{ fontSize: '11px' }}>
                      {v}
                    </Badge>
                  )},
                  { key: 'quantity', label: 'Qty', render: (v, row) => (
                    <Input type="number" min="1" value={String(v)} style={{ width: 70, textAlign: 'center' }}
                      onChange={(e) => handleQtyChange(selectedItems.indexOf(row), e.target.value)} />
                  )},
                  { key: 'chargePrice', label: 'MRP (₹)', render: (v) => formatCurrency(v) },
                  { key: 'discount', label: 'Discount (₹)', render: (v, row) => (
                    <Input type="number" min="0" value={String(row.discount || 0)} style={{ width: 80, textAlign: 'center' }}
                      onChange={(e) => handleDiscountChange(selectedItems.indexOf(row), e.target.value)} />
                  )},
                  { key: 'rate', label: 'Rate (₹)', render: (_, row) => formatCurrency(row.chargePrice - (row.discount || 0)) },
                  { key: 'lineTotal', label: 'Total (₹)', render: (_, row) => <strong>{formatCurrency((row.chargePrice - (row.discount || 0)) * row.quantity)}</strong> },
                  { key: 'actions', label: '', render: (_, row) => (
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleRemoveItem(selectedItems.indexOf(row))} />
                  )},
                ]}
                data={selectedItems}
              />
            )}
          </Card>

          {/* Payment Summary */}
          <Card title="3. Payment & Checkout" style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'Cash', label: '💵 Cash' },
                  { value: 'Card', label: '💳 Card' },
                  { value: 'UPI', label: '📱 UPI' },
                  { value: 'Insurance', label: '🏥 Insurance' },
                  { value: 'Bank Transfer', label: '🏦 Bank Transfer' },
                ]}
              />

              <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: '0 0 var(--space-md) 0' }}>Order Summary</h4>
                {selectedItems.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>No items added yet</p>
                ) : (
                  <>
                    {selectedItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: '4px 0', borderBottom: '1px dotted var(--border-primary)' }}>
                        <span>
                          {item.itemName}
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: 6 }}>
                            × {item.quantity} {item.unitLabel}
                          </span>
                        </span>
                        <strong>{formatCurrency((item.chargePrice - item.discount) * item.quantity)}</strong>
                      </div>
                    ))}
                  </>
                )}

                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-sm)' }}>
                    <span>Total MRP</span><span>{formatCurrency(itemTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-sm)', color: 'var(--accent-danger)' }}>
                    <span>Discount</span><span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-sm)' }}>
                    <span>Taxable Amount</span><span>{formatCurrency(taxableAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-sm)' }}>
                    <span>CGST (2.5%)</span><span>{formatCurrency(cgst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-sm)' }}>
                    <span>SGST (2.5%)</span><span>{formatCurrency(sgst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--accent-success)', marginTop: 'var(--space-sm)' }}>
                    <span><IndianRupee size={18} style={{ verticalAlign: 'middle' }} /> Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button variant="success" size="lg" onClick={handleRecordSale} loading={loading}
                style={{ width: '100%', fontSize: 'var(--font-md)', padding: '14px' }}>
                <CheckCircle size={18} style={{ marginRight: 8 }} /> Record Sale & Generate Invoice
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <SalesHistory />
      )}

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Sale Completed!" size="sm">
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          <CheckCircle size={56} style={{ color: 'var(--accent-success)', marginBottom: 'var(--space-md)' }} />
          <h2 style={{ margin: '0 0 var(--space-sm) 0' }}>Transaction Recorded</h2>
          {lastInvoice && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Invoice <strong>{lastInvoice.invoice_id}</strong> — {formatCurrency(parseFloat(lastInvoice.total_amount))}
            </p>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => lastInvoice && printReceipt(lastInvoice, lastPatient, lastItems)}>
              Print Receipt
            </Button>
            <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
      {/* Quick Patient Registration Modal */}
      <Modal isOpen={showPatientModal} onClose={() => setShowPatientModal(false)} title="Quick Patient Registration (Pharmacy Sales)" size="lg">
        <form onSubmit={handleQuickPatientSubmit}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {regError && (
              <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ {regError}
              </div>
            )}

            <div style={{ marginBottom: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Patient Category *
              </label>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pharmacyPatientCategory"
                    value="Adult"
                    checked={regForm.patientCategory !== 'Child'}
                    onChange={() => setRegForm({ ...regForm, patientCategory: 'Adult' })}
                  />
                  👨‍💼 Adult (≥ 10 Years)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pharmacyPatientCategory"
                    value="Child"
                    checked={regForm.patientCategory === 'Child'}
                    onChange={() => setRegForm({ ...regForm, patientCategory: 'Child' })}
                  />
                  👶 Child / Pediatric (&lt; 10 Years)
                </label>
              </div>
            </div>

            <div className="form-row">
              <Input 
                label="First Name *" 
                value={regForm.firstName} 
                onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} 
                required 
              />
              <Input 
                label="Last Name *" 
                value={regForm.lastName} 
                onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} 
                required 
              />
            </div>

            {regForm.patientCategory === 'Child' ? (
              <div className="form-row">
                <Input 
                  label="Age (Years)" 
                  type="number" 
                  min="0"
                  max="9"
                  placeholder="e.g. 4"
                  value={regForm.age} 
                  onChange={e => setRegForm({ ...regForm, age: e.target.value })} 
                />
                <Input 
                  label="Age (Months) *" 
                  type="number" 
                  min="0"
                  max="11"
                  placeholder="e.g. 6"
                  value={regForm.ageMonths} 
                  onChange={e => setRegForm({ ...regForm, ageMonths: e.target.value })} 
                  required
                />
                <Select 
                  label="Gender *" 
                  value={regForm.gender} 
                  onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                  options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} 
                />
              </div>
            ) : (
              <div className="form-row">
                <Input 
                  label="Age (Years) *" 
                  type="number" 
                  min="10"
                  max="120"
                  placeholder="e.g. 35"
                  value={regForm.age} 
                  onChange={e => setRegForm({ ...regForm, age: e.target.value })} 
                  required 
                />
                <Select 
                  label="Gender *" 
                  value={regForm.gender} 
                  onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                  options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} 
                />
              </div>
            )}

            <div className="form-row">
              <Input 
                label="Phone Number" 
                value={regForm.phone} 
                onChange={e => setRegForm({ ...regForm, phone: e.target.value })} 
              />
              <Select 
                label="Blood Group" 
                value={regForm.bloodGroup} 
                onChange={e => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                options={[{ value: '', label: '-- Select --' }, ...['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))]} 
              />
            </div>

            <div className="form-row">
              <Input 
                label="Patient Referred By" 
                value={regForm.referredBy} 
                onChange={e => setRegForm({ ...regForm, referredBy: e.target.value })} 
                placeholder="Doctor / Clinic / Source name" 
              />
              <Input 
                label="Address" 
                value={regForm.address} 
                onChange={e => setRegForm({ ...regForm, address: e.target.value })} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowPatientModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={regLoading} icon={<UserPlus size={16} />}>Register & Select Patient</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicineSales;
