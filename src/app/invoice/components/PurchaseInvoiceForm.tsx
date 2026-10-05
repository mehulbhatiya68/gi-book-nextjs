"use client";

import Link from "next/link";
import { useState, useEffect, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoArrowBack,
  IoClose,
  IoSearch,
  IoSettingsOutline,
  IoChevronForward,
  IoCreateOutline,
  IoAdd,
  IoRemove,
  IoTrashOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/PageHeader";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { partyApi } from "@/lib/api/party";
import { itemApi } from "@/lib/api/item";
import { invoiceApi } from "@/lib/api/invoice";
import { ledgerApi } from "@/lib/api/ledger";
import { settingsApi } from "@/lib/api/settings";
import MobiscrollDatePicker from "@/components/MobiscrollDatePicker";
import QuantityStepper from "@/components/QuantityStepper";
import { toast } from "react-toastify";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";

export default function PurchaseInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("editId") || searchParams?.get("id");
  const isEditMode = Boolean(editId);

  const { isLimitReached: isInvoiceLimitReached, used, quota, featureName } = useLimitCheck("invoice", isEditMode);
  const { isLimitReached: isPaymentLimitReached, used: paymentUsed, quota: paymentQuota } = useLimitCheck("transaction", isEditMode);

  const { activeBusiness } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  useEffect(() => {
    if (activeBusiness?.id) {
      Promise.all([
        partyApi.getParties(activeBusiness.id).catch(() => ({ body: [] })),
        itemApi.getItems({ per_page: 'all', silentError: true }).catch(() => ({ body: [] })),
        invoiceApi.getInvoices(activeBusiness.id).catch(() => ({ body: [] }))
      ]).then(([partiesRes, itemsRes, invoicesRes]) => {
        setParties(Array.isArray(partiesRes?.body) ? partiesRes.body : (partiesRes?.body?.data || partiesRes?.body?.parties || partiesRes?.body?.ledgers || []));
        setItems(Array.isArray(itemsRes?.body) ? itemsRes.body : (itemsRes?.body?.data || itemsRes?.body?.items || []));
        setInvoices(Array.isArray(invoicesRes?.body) ? invoicesRes.body : (invoicesRes?.body?.data || invoicesRes?.body?.invoices || []));
      });
    } else {
        setParties([]);
        setItems([]);
        setInvoices([]);
    }
  }, [activeBusiness?.id]);

  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [showPartyPopup, setShowPartyPopup] = useState(false);
  const [showItemPopup, setShowItemPopup] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [partySearch, setPartySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const generatePurchaseInvoiceNumber = (existingInvoices: any[] = []) => {
    const existingNums = new Set(
      (Array.isArray(existingInvoices) ? existingInvoices : []).map((inv) =>
        String(inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber?.number || inv.invoiceNumber || inv.number || "").toUpperCase()
      )
    );
    let num = "";
    do {
      const random6 = Math.floor(100000 + Math.random() * 900000);
      num = `PI-${random6}`;
    } while (existingNums.has(num.toUpperCase()));
    return num;
  };

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [prefixEnabled, setPrefixEnabled] = useState(false);
  const [invoicePrefix, setInvoicePrefix] = useState("PI");
  const [invoiceNumber, setInvoiceNumber] = useState("PI-000000");
  const [suffixEnabled, setSuffixEnabled] = useState(false);
  const [invoiceSuffix, setInvoiceSuffix] = useState("");

  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tempInvoiceDate, setTempInvoiceDate] = useState(invoiceDate);
  const [tempDueDate, setTempDueDate] = useState(dueDate);
  const [tempPrefixEnabled, setTempPrefixEnabled] = useState(prefixEnabled);
  const [tempInvoicePrefix, setTempInvoicePrefix] = useState(invoicePrefix);
  const [tempInvoiceNumber, setTempInvoiceNumber] = useState(invoiceNumber);
  const [tempSuffixEnabled, setTempSuffixEnabled] = useState(suffixEnabled);
  const [tempInvoiceSuffix, setTempInvoiceSuffix] = useState(invoiceSuffix);

  // Additional Features
  const [discountType, setDiscountType] = useState("percent"); // 'percent' | 'amount'
  const [discountValue, setDiscountValue] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  const [notes, setNotes] = useState("");

  // Robust Party Field Extractors
  const getPartyDisplayName = (party: any) => {
    if (!party) return "";
    return (
      party.partyName ||
      party.name ||
      party.party_name ||
      party.title ||
      party.ledger_name ||
      party.business_name ||
      party.customerName ||
      party.supplierName ||
      "Party"
    );
  };

  const getPartyPhone = (party: any) => {
    if (!party) return "";
    return party.phone || party.mobile || party.phone_number || party.mobile_number || party.contact || "";
  };

  const getPartyType = (party: any) => {
    if (!party) return "";
    return party.partyType || party.party_type || party.type || (party.is_supplier ? "Supplier" : party.is_customer ? "Customer" : "Supplier");
  };

  // Set default prefix from activeBusiness settings or settingsApi or localStorage if available
  useEffect(() => {
    if (isEditMode) return;
    const pFromBiz = activeBusiness?.invoice_prefix || activeBusiness?.invoicePrefix;
    if (pFromBiz) {
      setInvoicePrefix(pFromBiz);
      setTempInvoicePrefix(pFromBiz);
      return;
    }
    const savedPrefix = typeof window !== "undefined" ? (localStorage.getItem(`gi_invoice_prefix_${activeBusiness?.id}`) || localStorage.getItem("gi_invoice_prefix")) : null;
    if (savedPrefix) {
      setInvoicePrefix(savedPrefix);
      setTempInvoicePrefix(savedPrefix);
      return;
    }
    settingsApi.getSettings().then((res: any) => {
      const data = res?.body?.settings || res?.settings || res?.body || res;
      if (data?.invoice_prefix) {
        setInvoicePrefix(data.invoice_prefix);
        setTempInvoicePrefix(data.invoice_prefix);
        if (typeof window !== "undefined") {
          if (activeBusiness?.id) {
            localStorage.setItem(`gi_invoice_prefix_${activeBusiness.id}`, data.invoice_prefix);
          }
          localStorage.setItem("gi_invoice_prefix", data.invoice_prefix);
        }
      }
    }).catch(() => {});
  }, [activeBusiness, isEditMode]);

  // Unique Auto Purchase Invoice Number Logic according to API invoices
  useEffect(() => {
    if (!isEditMode) {
      if (invoiceNumber === "PI-000000" || invoiceNumber === "0001" || invoiceNumber.startsWith("PUR") || !invoiceNumber.startsWith("PI-")) {
        const nextNumStr = generatePurchaseInvoiceNumber(invoices);
        startTransition(() => {
          setInvoiceNumber(nextNumStr);
          setTempInvoiceNumber(nextNumStr);
        });
      }
    }
  }, [invoices, isEditMode, invoiceNumber]);

  const openInvoicePopup = () => {
    const today = new Date().toISOString().split("T")[0];
    setTempInvoiceDate(today);
    setTempDueDate(dueDate || today);
    setTempPrefixEnabled(prefixEnabled);
    setTempInvoicePrefix(invoicePrefix);
    setTempInvoiceNumber(invoiceNumber);
    setTempSuffixEnabled(suffixEnabled);
    setTempInvoiceSuffix(invoiceSuffix);
    setShowInvoicePopup(true);
  };

  const handleSaveInvoiceDetails = () => {
    const today = new Date().toISOString().split("T")[0];
    setInvoiceDate(today);
    setDueDate(tempDueDate || today);
    setPrefixEnabled(tempPrefixEnabled);
    setInvoicePrefix(tempInvoicePrefix);
    setInvoiceNumber(tempInvoiceNumber);
    setSuffixEnabled(tempSuffixEnabled);
    setInvoiceSuffix(tempInvoiceSuffix);
    setShowInvoicePopup(false);
  };

  const isSupplierParty = (party: any) => {
    if (!party) return false;
    const t = String(party.partyType || party.party_type || party.type || party.group || "").toLowerCase();
    if (
      t === "customer" ||
      t === "client" ||
      party.is_customer === true ||
      party.is_customer === 1 ||
      party.isCustomer === true
    ) {
      return false;
    }
    if (t === "bank" || t === "cash" || t === "expense") {
      return false;
    }
    return true;
  };

  const filteredParties = (Array.isArray(parties) ? parties : []).filter((party) => {
    if (!isSupplierParty(party)) return false;
    const search = partySearch.toLowerCase().trim();
    if (!search) return true;
    const name = getPartyDisplayName(party).toLowerCase();
    const phone = getPartyPhone(party).toLowerCase();
    return name.includes(search) || phone.includes(search);
  });

  // Robust Item Field Extractors
  const getItemName = (item: any) => {
    if (!item) return "";
    return item.itemName || item.item_name || item.name || item.title || "Unnamed Item";
  };

  const getItemCode = (item: any) => {
    if (!item) return "";
    return item.itemCode || item.item_code || item.code || "";
  };

  const getItemHsn = (item: any) => {
    if (!item) return "";
    return item.hsnCode || item.hsn_code || item.hsn_sac_code || item.hsn || "";
  };

  const getItemSalesPrice = (item: any) => {
    if (!item) return 0;
    return Number(item.salesPrice ?? item.sales_price ?? item.price ?? item.rate ?? 0);
  };

  const getItemPurchasePrice = (item: any) => {
    if (!item) return 0;
    return Number(item.purchasePrice ?? item.purchase_price ?? item.costPrice ?? item.price ?? item.rate ?? 0);
  };

  const getItemStock = (item: any) => {
    if (!item) return 0;
    return Number(item.stockQuantity ?? item.current_stock ?? item.currentStock ?? item.stock ?? 0);
  };

  const getItemType = (item: any) => {
    if (!item) return "Product";
    const t = String(item.itemType || item.item_type || item.type || "").toLowerCase();
    return t.includes("service") ? "Service" : "Product";
  };

  const getItemGst = (item: any) => {
    if (!item) return "None";
    if (item.gst && item.gst !== "None") return item.gst;
    if (item.tax_rate) return `GST @ ${item.tax_rate}%`;
    return "None";
  };

  const getItemPurchaseTaxType = (item: any) => {
    if (!item) return "With Tax";
    const tt = item.purchaseTaxType || item.purchase_price_tax_type || item.taxType;
    if (tt === "without_tax" || tt === "Without Tax") return "Without Tax";
    return "With Tax";
  };

  const filteredItems = (Array.isArray(items) ? items : []).filter((item) => {
    // Exclude service items in purchase invoice form
    if (getItemType(item) === "Service") return false;
    const search = itemSearch.toLowerCase().trim();
    if (!search) return true;
    const name = getItemName(item).toLowerCase();
    const hsn = getItemHsn(item).toLowerCase();
    const code = getItemCode(item).toLowerCase();
    return name.includes(search) || hsn.includes(search) || code.includes(search);
  });

  const handleSelectParty = (party) => {
    setSelectedParty(party);
    setPartySearch("");
    setShowPartyPopup(false);
  };

  // Helper for GST extraction
  const parseGstRate = (gstVal) => {
    if (!gstVal || gstVal === "None") return 0;
    const match = String(gstVal).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const handleToggleItem = (item) => {
    const itemId = item.id || item.item_id;
    const alreadySelected = selectedItems.find(
      (selectedItem) => (selectedItem.id || selectedItem.item_id) === itemId
    );

    if (alreadySelected) {
      setSelectedItems(
        selectedItems.filter((selectedItem) => (selectedItem.id || selectedItem.item_id) !== itemId)
      );
    } else {
      const name = getItemName(item);
      const price = getItemPurchasePrice(item);
      const quantity = 1;
      const gst = getItemGst(item);
      const rate = parseGstRate(gst) || item.tax_rate || 0;
      const taxType = getItemPurchaseTaxType(item);

      let taxableAmount = price * quantity;
      let taxAmount = 0;
      let lineTotal = price * quantity;

      if (taxType === "With Tax") {
        taxableAmount = rate > 0 ? (lineTotal / (1 + rate / 100)) : lineTotal;
        taxAmount = lineTotal - taxableAmount;
      } else {
        taxAmount = (taxableAmount * rate) / 100;
        lineTotal = taxableAmount + taxAmount;
      }

      setSelectedItems([
        ...selectedItems,
        {
          ...item,
          id: itemId,
          name,
          itemName: name,
          quantity,
          price,
          purchasePrice: price,
          rate,
          gst,
          taxType,
          taxableAmount,
          taxAmount,
          lineTotal,
        },
      ]);
    }
  };

  const handleQuantityChange = (id, quantity) => {
    if (quantity < 1) return;
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.id !== id) return item;

        const price = Number(item.price || item.purchasePrice || 0);
        const rate = item.gstRate ?? parseGstRate(item.gst);
        const taxType = item.taxType || item.purchaseTaxType || "With Tax";

        let taxableAmount = price * quantity;
        let taxAmount = 0;
        let lineTotal = price * quantity;

        if (taxType === "With Tax") {
          taxableAmount = rate > 0 ? (lineTotal / (1 + rate / 100)) : lineTotal;
          taxAmount = lineTotal - taxableAmount;
        } else {
          taxAmount = (taxableAmount * rate) / 100;
          lineTotal = taxableAmount + taxAmount;
        }

        return {
          ...item,
          quantity,
          taxableAmount,
          taxAmount,
          lineTotal,
        };
      })
    );
  };

  const handleRemoveItem = (id) => {
    if (!window.confirm("Are you sure you want to remove this item from the invoice?")) return;
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };

  const handlePopupQuantityChange = (item: any, delta: number) => {
    const itemId = item.id || item.item_id;
    const existingItem = selectedItems.find(
      (si: any) => (si.id || si.item_id) === itemId
    );

    if (!existingItem) {
      if (delta > 0) {
        handleToggleItem(item);
      }
      return;
    }

    const currentQty = Number(existingItem.quantity || 1);
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      setSelectedItems(
        selectedItems.filter((si: any) => (si.id || si.item_id) !== itemId)
      );
    } else {
      handleQuantityChange(existingItem.id || itemId, newQty);
    }
  };

  const handleOpenEditItemModal = (item: any) => {
    const price = Number(item.purchasePrice ?? item.purchase_price ?? item.price ?? item.rate ?? 0);
    const qty = Number(item.quantity ?? item.qty ?? 1);
    const unit = item.unit || "unit";
    const gstStr = item.gst || (item.gstRate ? `GST @ ${item.gstRate}%` : "None");
    const gstRate = item.gstRate ?? parseGstRate(gstStr);
    const taxType = item.taxType || item.purchaseTaxType || "Without Tax";

    setEditingItem({
      ...item,
      editPrice: price,
      editQuantity: qty,
      editUnit: unit,
      editDiscountType: item.discountType || "percent",
      editDiscountValue: item.discountValue || 0,
      editGst: gstStr,
      editGstRate: gstRate,
      editTaxType: taxType,
    });
    setShowEditItemModal(true);
  };

  const handleSaveItemEdit = () => {
    if (!editingItem) return;

    const targetId = editingItem.id || editingItem.item_id;
    const newPrice = Math.max(0, Number(editingItem.editPrice || 0));
    const newQty = Math.max(1, Number(editingItem.editQuantity || 1));
    const newUnit = String(editingItem.editUnit || "unit").trim();
    const newDiscType = editingItem.editDiscountType || "percent";
    const newDiscVal = Math.max(0, Number(editingItem.editDiscountValue || 0));
    const newGstRate = Number(editingItem.editGstRate ?? parseGstRate(editingItem.editGst));
    const newGstStr = editingItem.editGst || (newGstRate > 0 ? `GST @ ${newGstRate}%` : "None");
    const newTaxType = editingItem.editTaxType || "Without Tax";

    const basePriceTotal = newPrice * newQty;
    let discountAmount = 0;
    if (newDiscType === "percent") {
      discountAmount = (basePriceTotal * newDiscVal) / 100;
    } else {
      discountAmount = newDiscVal;
    }
    const taxableBase = Math.max(0, basePriceTotal - discountAmount);

    let taxableAmount = taxableBase;
    let taxAmount = 0;
    let lineTotal = taxableBase;

    if (newTaxType === "With Tax") {
      taxableAmount = newGstRate > 0 ? taxableBase / (1 + newGstRate / 100) : taxableBase;
      taxAmount = taxableBase - taxableAmount;
      lineTotal = taxableBase;
    } else {
      taxAmount = (taxableBase * newGstRate) / 100;
      lineTotal = taxableBase + taxAmount;
    }

    setSelectedItems(
      selectedItems.map((item: any) => {
        const isTarget = (item.id || item.item_id) === targetId;
        if (!isTarget) return item;

        return {
          ...item,
          price: newPrice,
          purchasePrice: newPrice,
          purchase_price: newPrice,
          rate: newPrice,
          quantity: newQty,
          qty: newQty,
          unit: newUnit,
          discountType: newDiscType,
          discountValue: newDiscVal,
          discountAmount,
          gst: newGstStr,
          gstRate: newGstRate,
          taxType: newTaxType,
          taxableAmount,
          taxAmount,
          lineTotal,
          amount: lineTotal,
        };
      })
    );

    setShowEditItemModal(false);
    setEditingItem(null);
    toast.success("Item updated for this invoice");
  };

  // Additional Charges Handlers
  const handleAddCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now(), name: "Freight / Delivery", amount: "" },
    ]);
  };

  const handleUpdateCharge = (id, field, value) => {
    setAdditionalCharges(
      additionalCharges.map((ch) =>
        ch.id === id ? { ...ch, [field]: value } : ch
      )
    );
  };

  const handleRemoveCharge = (id) => {
    if (!window.confirm("Are you sure you want to remove this charge?")) return;
    setAdditionalCharges(additionalCharges.filter((ch) => ch.id !== id));
  };

  // Calculations
  const subtotal = selectedItems.reduce((total, item) => {
    return total + (Number(item.taxableAmount) || (Number(item.price || 0) * Number(item.quantity || 1)));
  }, 0);

  const totalTaxAmount = selectedItems.reduce((total, item) => {
    return total + (Number(item.taxAmount) || 0);
  }, 0);

  const itemsTotalWithTax = selectedItems.reduce((total, item) => {
    return total + (Number(item.lineTotal) || (Number(item.price || 0) * Number(item.quantity || 1)));
  }, 0);

  const discountAmount =
    discountType === "percent" || discountType === "percentage"
      ? (itemsTotalWithTax * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);

  const discountPercentage =
    discountType === "percent" || discountType === "percentage"
      ? Number(discountValue || 0)
      : itemsTotalWithTax > 0
      ? (discountAmount / itemsTotalWithTax) * 100
      : 0;

  const totalAdditionalCharges = additionalCharges.reduce(
    (sum, ch) => sum + Number(ch.amount || 0),
    0
  );

  const rawTotal = Math.max(0, itemsTotalWithTax - discountAmount + totalAdditionalCharges);
  const totalAmount = enableRoundOff ? Math.round(rawTotal) : Number(rawTotal.toFixed(2));
  const roundOffAmount = enableRoundOff ? Number((totalAmount - rawTotal).toFixed(2)) : 0;

  const [isPaid, setIsPaid] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Cash");

  useEffect(() => {
    if (!isEditMode && isPaymentLimitReached && isPaid) {
      setIsPaid(false);
    }
  }, [isPaymentLimitReached, isPaid, isEditMode]);

  const handleGenerateInvoice = async () => {
    if (!selectedParty) {
      toast.error("Please select a supplier / party.");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item.");
      return;
    }

    const fullInvoiceNum = `${prefixEnabled ? invoicePrefix + " " : ""}${invoiceNumber}${suffixEnabled ? " " + invoiceSuffix : ""}`;
    const partyLedgerId = selectedParty.ledger_id || selectedParty.ledger?.id || selectedParty.id;

    const parseGstRate = (gstVal: any) => {
      if (!gstVal || gstVal === "None") return 0;
      const match = String(gstVal).match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const formattedItems = selectedItems.map((item: any) => {
      const qty = Math.max(0.01, Number(item.quantity || item.qty || 1));
      const rawPrice = Number(item.purchasePrice ?? item.purchase_price ?? item.price ?? item.rate ?? 0);
      const unitRate = Number(rawPrice.toFixed(2));
      const gross = qty * unitRate;

      const taxRate = Number(item.tax_rate ?? item.gstRate ?? (parseGstRate(item.gst) || 0));
      const taxTypeRaw = item.tax_type ?? item.taxType ?? item.purchase_price_tax_type ?? "without_tax";
      const isWithTax = taxTypeRaw === "with_tax" || taxTypeRaw === "With Tax";
      const taxType = isWithTax ? "with_tax" : "without_tax";

      const discountVal = Number(item.discount || 0);
      const discountTypeRaw = String(item.discount_type || item.discountType || "Percentage").toLowerCase();
      const discountType = discountTypeRaw === "fixed" ? "Fixed" : "Percentage";

      let calcDiscAmount = Number(item.discount_amount || item.discountAmount || 0);
      if (calcDiscAmount <= 0 && discountVal > 0) {
        calcDiscAmount = discountType === "Fixed"
          ? discountVal
          : gross * (Math.min(100, Math.max(0, discountVal)) / 100);
      }

      let lineAmt = Number(item.amount || item.lineTotal || 0);
      if (lineAmt <= 0) {
        if (isWithTax) {
          lineAmt = Math.max(0, gross - calcDiscAmount);
        } else {
          const b = Math.max(0, gross - calcDiscAmount);
          lineAmt = b + (b * (taxRate / 100));
        }
      }

      let baseAmount = Number(item.base_amount || item.taxableAmount || 0);
      if (baseAmount <= 0) {
        if (isWithTax) {
          baseAmount = taxRate > 0 ? lineAmt / (1 + taxRate / 100) : lineAmt;
        } else {
          baseAmount = Math.max(0, gross - calcDiscAmount);
        }
      }

      let taxAmount = Number(item.tax_amount || item.taxAmount || 0);
      if (taxAmount <= 0 && taxRate > 0) {
        if (isWithTax) {
          taxAmount = lineAmt - baseAmount;
        } else {
          taxAmount = baseAmount * (taxRate / 100);
        }
      }

      const itemPayload: any = {
        item_id: String(item.item_id || item.id),
        quantity: Number(qty.toFixed(2)),
        rate: unitRate,
        amount: Number(lineAmt.toFixed(2)),
      };

      if (taxRate > 0) {
        itemPayload.tax_rate = Number(taxRate.toFixed(2));
        itemPayload.tax_type = taxType;
        itemPayload.tax_amount = Number(taxAmount.toFixed(2));
      }
      if (baseAmount > 0) {
        itemPayload.base_amount = Number(baseAmount.toFixed(2));
      }
      if (item.unit || item.item?.unit) {
        itemPayload.unit = String(item.unit || item.item?.unit);
      }
      if (discountVal > 0) {
        itemPayload.discount = Number(discountVal.toFixed(2));
        itemPayload.discount_type = discountType;
        itemPayload.discount_amount = Number(calcDiscAmount.toFixed(2));
      }

      return itemPayload;
    });

    const itemsCalculatedTotal = formattedItems.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
    const calculatedRawTotal = Math.max(0, itemsCalculatedTotal - discountAmount + totalAdditionalCharges);
    const calculatedTotalAmount = enableRoundOff ? Math.round(calculatedRawTotal) : Number(calculatedRawTotal.toFixed(2));

    const formattedInvoiceDate = invoiceDate || new Date().toISOString().split("T")[0];
    const formattedDueDate = dueDate || formattedInvoiceDate;

    const invoicePayload: any = {
      ledger_id: partyLedgerId,
      invoice_number: fullInvoiceNum || `PUR-${Date.now()}`,
      amount: calculatedTotalAmount,
      status: "unpaid",
      is_paid: false,
      due_date: formattedDueDate,
      items: formattedItems,
    };

    if (discountPercentage > 0) {
      invoicePayload.discount_percentage = Number(discountPercentage.toFixed(2));
    }
    if (discountAmount > 0) {
      invoicePayload.discount_amount = Number(discountAmount.toFixed(2));
    }
    if (totalAdditionalCharges > 0) {
      invoicePayload.additional_charges = Number(totalAdditionalCharges.toFixed(2));
    }
    if (enableRoundOff && roundOffAmount !== 0) {
      invoicePayload.round_off_amount = Number(roundOffAmount.toFixed(2));
    }
    if (notes && notes.trim()) {
      invoicePayload.note = notes.trim();
    }

    try {
      const res: any = await invoiceApi.createInvoice(invoicePayload);
      const createdInv = res?.body?.invoice || res?.body || res;
      const invoiceId = createdInv?.id;

      if (isPaid && !isPaymentLimitReached && invoiceId) {
        try {
          const ledgersRes: any = await ledgerApi.getLedgers({ per_page: "all", silentError: true }).catch(() => null);
          const ledgerList = ledgersRes?.body?.data || ledgersRes?.body?.ledgers || ledgersRes?.body || ledgersRes?.data || (Array.isArray(ledgersRes) ? ledgersRes : []);
          const paymentLedger = ledgerList.find((l: any) => {
            const t = String(l.type || l.ledger_type || "").toLowerCase();
            const n = String(l.name || "").toLowerCase();
            const m = String(paymentMode || "").toLowerCase();
            if (m.includes("cash")) return t === "cash" || n.includes("cash");
            if (m.includes("bank") || m.includes("upi") || m.includes("cheque") || m.includes("online")) return t === "bank" || n.includes("bank");
            return t === "cash" || t === "bank" || n.includes("cash") || n.includes("bank");
          }) || ledgerList.find((l: any) => {
            const t = String(l.type || l.ledger_type || "").toLowerCase();
            const n = String(l.name || "").toLowerCase();
            return t === "cash" || t === "bank" || n.includes("cash") || n.includes("bank");
          });

          if (paymentLedger?.id) {
            await invoiceApi.receivePayment(invoiceId, {
              payment_ledger_id: paymentLedger.id,
              amount: Number(calculatedTotalAmount || totalAmount || 0),
              transaction_date: formattedInvoiceDate,
              remark: `Payment completed via ${paymentMode}`,
            }).catch((err) => console.warn("receivePayment warning:", err));
          }

          await invoiceApi.updateInvoiceStatus(invoiceId, "paid").catch((err) => console.warn("updateInvoiceStatus warning:", err));
        } catch (payErr) {
          console.warn("Receive payment post-processing warning:", payErr);
        }
      }

      toast.success("Purchase invoice recorded successfully!");
      router.replace(invoiceId ? `/invoice/${invoiceId}` : "/invoice");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to create purchase invoice");
    }
  };

  if (isInvoiceLimitReached) {
    return (
      <LimitReachedView
        featureName={featureName}
        usedCount={used}
        quotaLimit={quota}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Back Button */}
      <PageHeader
        title="Create Purchase Invoice"
        subtitle="Record a vendor purchase bill & inward stock entry"
        backUrl="/invoice"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Unified Purchase Bill Header & Vendor Card */}
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Supplier / Vendor Selector */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500 mb-1.5">
                  Supplier / Vendor *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPartyPopup(true)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 p-3 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-800/50 hover:border-indigo-500 dark:hover:border-indigo-500 transition cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {selectedParty ? getPartyDisplayName(selectedParty) : "Click to select vendor..."}
                    </p>
                    {selectedParty && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {getPartyPhone(selectedParty) || "No Phone"} • {getPartyType(selectedParty) || "Supplier"}
                      </p>
                    )}
                  </div>

                  <IoChevronForward className="text-lg text-slate-400 shrink-0" />
                </button>
              </div>

              {/* Purchase Bill Identifier & Configuration */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                    Purchase Bill Identifier
                  </p>
                  <p suppressHydrationWarning className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {prefixEnabled ? `${invoicePrefix} ` : ""}
                    {invoiceNumber}
                    {suffixEnabled ? ` ${invoiceSuffix}` : ""}
                  </p>
                  <p suppressHydrationWarning className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Bill Date: {new Date(invoiceDate).toLocaleDateString("en-IN")} • Due Date: {new Date(dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openInvoicePopup}
                  className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
                  title="Edit Invoice Details"
                >
                  <IoCreateOutline className="text-base" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          </section>

          {/* Items Section */}
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Purchased Items & Supplies</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Add inventory products or services to this bill</p>
              </div>

              <button
                type="button"
                onClick={() => setShowItemPopup(true)}
                className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <IoAdd className="text-base" />
                <span>Add Items</span>
              </button>
            </div>

            {selectedItems.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {getItemName(item)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span>₹{Number(item.price || item.purchasePrice || 0).toFixed(2)} / {item.unit || "unit"}</span>
                        {item.gst && item.gst !== "None" && (
                          <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-medium text-[10px]">
                            {item.gst} ({item.taxType || "With Tax"})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, Number(e.target.value))
                          }
                          className="w-14 h-8 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center text-xs font-semibold outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="text-right min-w-[65px]">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          ₹{Number(item.lineTotal || (item.price * item.quantity)).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditItemModal(item)}
                        className="h-8 px-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-50 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1"
                        title="Edit Item Price, Qty, Unit, Discount & GST"
                      >
                        <IoCreateOutline className="text-sm" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center justify-center"
                        title="Remove Item"
                      >
                        <IoClose className="text-lg" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => setShowItemPopup(true)}
                className="rounded-lg border-2 border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition"
              >
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">No items added yet</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Click here or the button above to add items to this purchase bill</p>
              </div>
            )}
          </section>

          {/* Adjustments & Notes */}
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Discount & Charges</h3>

            {/* Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Discount Type
                </label>
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition cursor-pointer ${discountType === "percent"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400"
                      }`}
                  >
                    Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("amount")}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition cursor-pointer ${discountType === "amount"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400"
                      }`}
                  >
                    Fixed (₹)
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Discount Value ({discountType === "percent" ? "%" : "₹"})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "e.g. 5%" : "e.g. ₹100"}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Additional Charges (Freight / Tax / Packaging)
                </label>
                <button
                  type="button"
                  onClick={handleAddCharge}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <IoAdd className="text-sm" /> Add Charge
                </button>
              </div>

              {additionalCharges.length > 0 && (
                <div className="space-y-2 mb-2">
                  {additionalCharges.map((ch, idx) => (
                    <div key={ch.id || `charge-${idx}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ch.name}
                        onChange={(e) => handleUpdateCharge(ch.id, "name", e.target.value)}
                        placeholder="Charge Name (e.g. Freight)"
                        className="flex-1 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ch.amount}
                        onChange={(e) => handleUpdateCharge(ch.id, "amount", e.target.value)}
                        placeholder="Amount ₹"
                        className="w-28 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCharge(ch.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <IoTrashOutline className="text-base" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Notes & Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add purchase bill notes..."
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </section>
        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-6">
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-3 sticky top-20">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-2.5">
              Bill Calculation
            </h3>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Taxable Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {totalTaxAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span>Tax / GST</span>
                <span>+ ₹{totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount</span>
                <span>- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {totalAdditionalCharges > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                <span>Additional Charges</span>
                <span>+ ₹{totalAdditionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Round Off */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
              <span className="text-slate-600 dark:text-zinc-400">Round Off Total</span>
              <button
                type="button"
                onClick={() => setEnableRoundOff(!enableRoundOff)}
                className={`relative w-8 h-4.5 rounded-full transition cursor-pointer ${enableRoundOff ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                  }`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${enableRoundOff ? "left-4" : "left-0.5"
                    }`}
                />
              </button>
            </div>

            {/* Mark as Paid Toggle */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Mark as Paid</p>
                    {!isEditMode && isPaymentLimitReached && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/60">
                        Limit Reached
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {!isEditMode && isPaymentLimitReached
                      ? `Transaction limit reached (${paymentUsed}/${paymentQuota}). Unpaid invoice only.`
                      : "Record full payment on creation"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isEditMode && isPaymentLimitReached}
                  onClick={() => {
                    if (!isEditMode && isPaymentLimitReached && !isPaid) {
                      toast.warning(
                        `Transaction limit reached (${paymentUsed}/${paymentQuota}). You can create unpaid invoices, but cannot mark them as paid until your plan is upgraded.`
                      );
                      return;
                    }
                    setIsPaid(!isPaid);
                  }}
                  className={`relative w-9 h-5 rounded-full transition cursor-pointer ${
                    isPaid
                      ? "bg-emerald-600"
                      : !isEditMode && isPaymentLimitReached
                      ? "bg-slate-200 dark:bg-zinc-800 opacity-50 cursor-not-allowed"
                      : "bg-slate-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      isPaid ? "left-4.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {isPaid && (
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Payment Mode:
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
              <p className="text-xs uppercase font-semibold text-amber-600 dark:text-amber-400">Total Amount (To Pay)</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                ₹{totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="w-full h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer font-semibold text-xs sm:text-sm shadow-sm mt-4"
            >
              Generate Purchase Invoice
            </button>
          </section>
        </div>
      </div>

      {/* Edit Details Popup */}
      {showInvoicePopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowInvoicePopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Invoice Number & Date Configuration
              </h2>
              <button
                type="button"
                onClick={() => setShowInvoicePopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <MobiscrollDatePicker
                  label="Invoice Date (Today)"
                  value={tempInvoiceDate}
                  onChange={() => {}}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <MobiscrollDatePicker
                  label="Due Date"
                  value={tempDueDate}
                  onChange={(d) => setTempDueDate(d)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Prefix</label>
                  <button
                    type="button"
                    onClick={() => setTempPrefixEnabled(!tempPrefixEnabled)}
                    className={`relative w-7 h-4 rounded-full transition cursor-pointer ${tempPrefixEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${tempPrefixEnabled ? "left-3.5" : "left-0.5"
                        }`}
                    />
                  </button>
                </div>
                <input
                  type="text"
                  value={tempInvoicePrefix}
                  onChange={(e) => setTempInvoicePrefix(e.target.value)}
                  disabled={!tempPrefixEnabled}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Number
                </label>
                <input
                  type="text"
                  value={tempInvoiceNumber}
                  onChange={(e) => setTempInvoiceNumber(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Suffix</label>
                  <button
                    type="button"
                    onClick={() => setTempSuffixEnabled(!tempSuffixEnabled)}
                    className={`relative w-7 h-4 rounded-full transition cursor-pointer ${tempSuffixEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${tempSuffixEnabled ? "left-3.5" : "left-0.5"
                        }`}
                    />
                  </button>
                </div>
                <input
                  type="text"
                  value={tempInvoiceSuffix}
                  onChange={(e) => setTempInvoiceSuffix(e.target.value)}
                  disabled={!tempSuffixEnabled}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-40"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveInvoiceDetails}
              className="w-full h-9 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer font-semibold text-xs shadow-sm"
            >
              Save Parameters
            </button>
          </div>
        </div>
      )}

      {/* Select Supplier Popup */}
      {showPartyPopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowPartyPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Supplier</h2>
              <button
                type="button"
                onClick={() => setShowPartyPopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="relative mb-3">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                placeholder="Search by name..."
                autoFocus
                className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-y-auto max-h-[50vh] space-y-1.5 pr-0.5">
              {filteredParties.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  No suppliers found. <Link href="/addParty" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Add Party</Link>
                </div>
              ) : (
                filteredParties.map((party) => {
                  const pName = getPartyDisplayName(party);
                  const pPhone = getPartyPhone(party);
                  const pType = getPartyType(party);
                  return (
                    <button
                      key={party.id || party.ledger_id}
                      type="button"
                      onClick={() => handleSelectParty(party)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-zinc-800/40 transition cursor-pointer text-left"
                    >
                      <div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white block">{pName}</span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">{pType}{pPhone ? ` • ${pPhone}` : ""}</span>
                      </div>
                      <IoChevronForward className="text-base text-slate-400" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Items Popup */}
      {showItemPopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowItemPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Items</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Click items to toggle selection for bill</p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer shrink-0"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="relative mb-3">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search by HSN / Name..."
                autoFocus
                className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[45vh] pr-1">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  No items found.{" "}
                  <Link href="/addItem" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                    + Create New Item
                  </Link>
                </div>
              ) : (
                filteredItems.map((item: any) => {
                  const itemId = item.id || item.item_id;
                  const selectedObj = selectedItems.find(
                    (selectedItem: any) => (selectedItem.id || selectedItem.item_id) === itemId
                  );
                  const isSelected = Boolean(selectedObj);
                  const selectedQty = Number(selectedObj?.quantity || 1);
                  const name = getItemName(item);
                  const hsn = item.hsnCode || item.hsn_code;
                  const price = Number(item.purchasePrice || item.purchase_price || item.price || 0);

                  return (
                    <div
                      key={itemId || name}
                      onClick={() => {
                        if (!isSelected) {
                          handleToggleItem(item);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition cursor-pointer text-left ${
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500"
                          : "bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:border-indigo-500"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {hsn ? `HSN: ${hsn}` : "No HSN"} • Stock: {item.stockQuantity ?? item.stock_quantity ?? 0} {item.unit || "unit"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">
                          ₹{price.toFixed(2)}
                        </p>

                        {isSelected ? (
                          <QuantityStepper
                            value={selectedQty}
                            min={0}
                            onDecrease={() => handlePopupQuantityChange(item, -1)}
                            onIncrease={() => handlePopupQuantityChange(item, 1)}
                            onChange={(newVal) =>
                              handlePopupQuantityChange(item, newVal - selectedQty)
                            }
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleItem(item);
                            }}
                            className="text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Confirmation Bar */}
            <div className="border-t border-slate-200 dark:border-zinc-800 mt-4 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Subtotal: ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/addItem"
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold text-center shrink-0 cursor-pointer"
                >
                  + Create Item
                </Link>
                <button
                  type="button"
                  onClick={() => setShowItemPopup(false)}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition cursor-pointer shadow-sm"
                >
                  Done Selecting ({selectedItems.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowEditItemModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edit Item: {editingItem.itemName || editingItem.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Modify purchase price, quantity, unit, discount & GST for this bill
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditItemModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Purchase Price & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editingItem.editPrice}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, editPrice: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={editingItem.editQuantity}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, editQuantity: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Unit & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editingItem.editUnit}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, editUnit: e.target.value })
                    }
                    placeholder="e.g. Pcs, Kg, Bag, Mtr"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Discount
                  </label>
                  <div className="flex items-center gap-1">
                    <select
                      value={editingItem.editDiscountType}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, editDiscountType: e.target.value })
                      }
                      className="h-9 px-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-semibold text-slate-700 dark:text-zinc-300 text-xs outline-none"
                    >
                      <option value="percent">%</option>
                      <option value="amount">₹</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editingItem.editDiscountValue}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, editDiscountValue: e.target.value })
                      }
                      placeholder="0"
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* GST Rate & Tax Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    GST Rate
                  </label>
                  <select
                    value={editingItem.editGstRate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setEditingItem({
                        ...editingItem,
                        editGstRate: rate,
                        editGst: rate > 0 ? `GST @ ${rate}%` : "None",
                      });
                    }}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value={0}>None / Exempt (0%)</option>
                    <option value={5}>GST @ 5%</option>
                    <option value={12}>GST @ 12%</option>
                    <option value={18}>GST @ 18%</option>
                    <option value={28}>GST @ 28%</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Tax Type
                  </label>
                  <select
                    value={editingItem.editTaxType}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, editTaxType: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Without Tax">Without Tax (Exclusive)</option>
                    <option value="With Tax">With Tax (Inclusive)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowEditItemModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItemEdit}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

