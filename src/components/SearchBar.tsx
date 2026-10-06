"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IoSearch,
  IoClose,
  IoPeopleOutline,
  IoCubeOutline,
  IoDocumentTextOutline,
  IoReceiptOutline,
  IoPersonOutline,
  IoChevronForward,
  IoLocationOutline,
  IoArrowForwardOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
  IoAddCircleOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { invoiceApi } from "@/lib/api/invoice";
import { partyApi } from "@/lib/api/party";
import { itemApi } from "@/lib/api/item";
import { paymentApi } from "@/lib/api/payment";
import { staffApi } from "@/lib/api/staff";
import FilterTabs from "@/components/FilterTabs";
import { siteProjectApi } from "@/lib/api/siteProject";

export default function SearchBar({
  searchOptions = ["All", "Invoices", "Parties", "Items", "Payments", "Staff", "Sites"],
  placeholder = "Search invoices, parties, items, payments...",
  onSelectInvoice = null,
  autoFocus = false,
}: {
  searchOptions?: string[];
  placeholder?: string;
  onSelectInvoice?: ((invoice: any) => void) | null;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const { activeBusiness } = useAuth();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [siteProjects, setSiteProjects] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedOption, setSelectedOption] = useState(searchOptions[0] || "All");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Fetch real-time searchable data from APIs whenever active business changes or search focused
  useEffect(() => {
    let isMounted = true;
    setIsLoadingData(true);

    Promise.all([
      invoiceApi.getInvoices({ per_page: "all", silentError: true }).catch(() => null),
      partyApi.getParties().catch(() => null),
      itemApi.getItems({ per_page: "all", silentError: true }).catch(() => null),
      paymentApi.getPayments().catch(() => null),
      staffApi.getStaff({ silentError: true }).catch(() => null),
      siteProjectApi.getSiteProjects(activeBusiness?.id).catch(() => null),
    ])
      .then(([invoicesRes, partiesRes, itemsRes, paymentsRes, staffRes, siteProjectsRes]: any[]) => {
        if (!isMounted) return;

        const invList = Array.isArray(invoicesRes?.body)
          ? invoicesRes.body
          : invoicesRes?.body?.invoices || invoicesRes?.body?.data || [];

        const partyList = Array.isArray(partiesRes?.body)
          ? partiesRes.body
          : partiesRes?.body?.parties || partiesRes?.body?.data || [];

        const itemList = Array.isArray(itemsRes?.body)
          ? itemsRes.body
          : itemsRes?.body?.items || itemsRes?.body?.data || [];

        const payList = Array.isArray(paymentsRes?.body)
          ? paymentsRes.body
          : paymentsRes?.body?.payments || paymentsRes?.body?.data || [];

        const stList = Array.isArray(staffRes?.body)
          ? staffRes.body
          : staffRes?.body?.staff || staffRes?.body?.data || [];

        const spList = Array.isArray(siteProjectsRes?.body)
          ? siteProjectsRes.body
          : siteProjectsRes?.body?.projects || siteProjectsRes?.body?.sites || siteProjectsRes?.body?.data || [];

        setInvoices(Array.isArray(invList) ? invList : []);
        setParties(Array.isArray(partyList) ? partyList : []);
        setItems(Array.isArray(itemList) ? itemList : []);
        setPayments(Array.isArray(payList) ? payList : []);
        setStaffList(Array.isArray(stList) ? stList : []);
        setSiteProjects(Array.isArray(spList) ? spList : []);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeBusiness?.id]);

  const query = search.trim().toLowerCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchedInvoices = (selectedOption === "All" || selectedOption === "Invoices") && query
    ? invoices.filter((inv) => {
        const invNum = String(inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber || inv.number || inv.id || "").toLowerCase();
        const partyName = String(inv.partyName || inv.party_name || inv.party?.partyName || inv.party?.name || inv.ledger_name || inv.ledger?.name || "").toLowerCase();
        const invType = String(inv.invoiceType || inv.type || inv.invoice_type || "").toLowerCase();
        const amountStr = String(inv.amount || inv.totalAmount || inv.total || "");
        const statusStr = String(inv.status || "").toLowerCase();

        const invItems = inv.items || inv.invoice_items || [];
        const itemNamesMatch = Array.isArray(invItems) && invItems.some((ii: any) =>
          String(ii.item_name || ii.itemName || ii.name || "").toLowerCase().includes(query)
        );

        return (
          invNum.includes(query) ||
          partyName.includes(query) ||
          invType.includes(query) ||
          amountStr.includes(query) ||
          statusStr.includes(query) ||
          itemNamesMatch
        );
      }).slice(0, 6)
    : [];

  const matchedParties = (selectedOption === "All" || selectedOption === "Parties") && query
    ? parties.filter((p) => {
        const pName = String(p.partyName || p.name || p.party_name || p.title || "").toLowerCase();
        const phone = String(p.phone || p.mobile || p.contact_number || p.contact || "");
        const gstin = String(p.gstNumber || p.gst_number || p.gstin || "").toLowerCase();
        const pType = String(p.partyType || p.party_type || p.type || "").toLowerCase();
        const address = String(p.address || p.city || p.state || "").toLowerCase();

        return (
          pName.includes(query) ||
          phone.includes(query) ||
          gstin.includes(query) ||
          pType.includes(query) ||
          address.includes(query)
        );
      }).slice(0, 6)
    : [];

  const matchedItems = (selectedOption === "All" || selectedOption === "Items") && query
    ? items.filter((item) => {
        const itemName = String(item.itemName || item.name || item.item_name || "").toLowerCase();
        const hsn = String(item.hsnCode || item.hsn_sac_code || item.hsn || "").toLowerCase();
        const code = String(item.itemCode || item.item_code || item.sku || "").toLowerCase();
        const cat = String(item.category || item.itemType || item.type || "").toLowerCase();

        return (
          itemName.includes(query) ||
          hsn.includes(query) ||
          code.includes(query) ||
          cat.includes(query)
        );
      }).slice(0, 6)
    : [];

  const matchedPayments = (selectedOption === "All" || selectedOption === "Payments") && query
    ? payments.filter((pay) => {
        const pName = String(pay.party?.partyName || pay.partyName || pay.party_name || pay.ledger_name || "").toLowerCase();
        const mode = String(pay.mode || pay.payment_mode || "").toLowerCase();
        const amountStr = String(pay.amount || "");
        const typeStr = String(pay.type || "").toLowerCase();
        const remark = String(pay.remark || pay.notes || "").toLowerCase();

        return (
          pName.includes(query) ||
          mode.includes(query) ||
          amountStr.includes(query) ||
          typeStr.includes(query) ||
          remark.includes(query)
        );
      }).slice(0, 6)
    : [];

  const matchedStaff = (selectedOption === "All" || selectedOption === "Staff") && query
    ? staffList.filter((st) => {
        const stName = String(st.name || st.user_name || "").toLowerCase();
        const phone = String(st.mobile || st.phone || "");
        const role = String(st.role || st.user_type || "").toLowerCase();

        return (
          stName.includes(query) ||
          phone.includes(query) ||
          role.includes(query)
        );
      }).slice(0, 5)
    : [];

  const matchedSites = (selectedOption === "All" || selectedOption === "Sites") && query
    ? siteProjects.filter((sp) => {
        const spName = String(sp.name || sp.siteName || sp.projectName || "").toLowerCase();
        const code = String(sp.code || sp.location || sp.city || "").toLowerCase();
        const typeStr = String(sp.type || "").toLowerCase();

        return (
          spName.includes(query) ||
          code.includes(query) ||
          typeStr.includes(query)
        );
      }).slice(0, 5)
    : [];

  const quickPages = selectedOption === "All" && query
    ? [
        { title: "Sales Invoice Form", href: "/addInvoice/sales", icon: IoAddCircleOutline },
        { title: "Add Purchase Invoice", href: "/addInvoice/purchase", icon: IoAddCircleOutline },
        { title: "Create Item", href: "/addItem", icon: IoAddCircleOutline },
        { title: "Add Party", href: "/addParty", icon: IoAddCircleOutline },
        { title: "Reports & Analytics", href: "/reports", icon: IoStatsChartOutline },
        { title: "Business Settings", href: "/settings", icon: IoSettingsOutline },
      ].filter((page) => page.title.toLowerCase().includes(query))
    : [];

  const totalResults =
    matchedInvoices.length + matchedParties.length + matchedItems.length +
    matchedPayments.length + matchedStaff.length + matchedSites.length + quickPages.length;

  const showDropdown = focused && query.length > 0;

  const navigateTo = (url: string, invData: any = null) => {
    setFocused(false);
    setSearch("");
    if (invData && onSelectInvoice) {
      onSelectInvoice(invData);
    } else {
      let finalUrl = url;
      if (url.startsWith("/paymentDetails/") && !url.includes("?from=")) {
        const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
        if (currentPath) {
          finalUrl = `${url}?from=${encodeURIComponent(currentPath)}`;
        }
      }
      router.push(finalUrl);
    }
  };

  const rowStyle = { background: "var(--gi-surface-secondary)", border: "1px solid var(--gi-border)" };
  const rowHoverIn = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = "var(--gi-hover)"; };
  const rowHoverOut = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = "var(--gi-surface-secondary)"; };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Inline Search Input */}
      <div className="relative w-full">
        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--gi-text-muted)" }} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="w-full h-9 pl-8 pr-8 rounded-lg text-xs gi-input focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
            style={{ color: "var(--gi-text-muted)" }}
          >
            <IoClose className="text-sm" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl shadow-2xl"
          style={{ background: "var(--gi-surface)", border: "1px solid var(--gi-border)", maxHeight: "440px", overflowY: "auto" }}
        >
          {/* Category filter pills */}
          <div className="px-3 pt-2.5 pb-2 border-b gi-divider">
            <FilterTabs
              options={searchOptions.map((opt) => ({ id: opt, label: opt }))}
              activeId={selectedOption}
              onChange={setSelectedOption}
              layoutId="searchBarFilterPill"
              className="w-full"
            />
          </div>

          <div className="p-2 space-y-3">
            {totalResults === 0 ? (
              <div className="py-8 text-center">
                <IoSearch className="text-3xl mx-auto mb-2 opacity-30" style={{ color: "var(--gi-text-muted)" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--gi-text)" }}>
                  No results for &quot;{search}&quot;
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--gi-text-muted)" }}>
                  Try a party name, invoice number, item code, or location
                </p>
              </div>
            ) : (
              <>
                {/* INVOICES */}
                {matchedInvoices.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoDocumentTextOutline className="text-xs" /> Invoices
                    </p>
                    {matchedInvoices.map((inv) => {
                      const invNum = inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber || inv.number || inv.id;
                      const partyName = inv.partyName || inv.party_name || inv.party?.name || inv.ledger_name || "Party";
                      const isSales = (inv.invoiceType || inv.type || inv.invoice_type) === "sales" || (inv.invoiceType || inv.type || inv.invoice_type) === "sales_invoice";
                      return (
                        <div
                          key={inv.id}
                          onClick={() => navigateTo(`/invoice/${inv.id}`, inv)}
                          className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                          style={rowStyle}
                          onMouseEnter={rowHoverIn}
                          onMouseLeave={rowHoverOut}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{invNum}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isSales ? "gi-badge-success" : "gi-badge-info"}`}>
                                {isSales ? "Sales" : "Purchase"}
                              </span>
                            </div>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>{partyName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-xs" style={{ color: "var(--gi-text)" }}>
                              ₹{Number(inv.totalAmount || inv.amount || 0).toLocaleString("en-IN")}
                            </span>
                            <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PARTIES */}
                {matchedParties.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoPeopleOutline className="text-xs" /> Parties
                    </p>
                    {matchedParties.map((p) => {
                      const pName = p.partyName || p.name || p.party_name || "Party";
                      const bal = Number(p.current_balance ?? p.closingBalance ?? p.opening_balance ?? 0);
                      return (
                        <div
                          key={p.id || p.ledger_id}
                          onClick={() => navigateTo(`/parties/${p.id || p.ledger_id}`)}
                          className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                          style={rowStyle}
                          onMouseEnter={rowHoverIn}
                          onMouseLeave={rowHoverOut}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{pName}</p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>
                              {p.partyType || p.party_type || p.type || "Party"}{p.phone || p.mobile ? ` • ${p.phone || p.mobile}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-semibold text-xs" style={{ color: bal < 0 ? "var(--gi-danger)" : "var(--gi-success)" }}>
                              ₹{Math.abs(bal).toLocaleString("en-IN")} {bal < 0 ? "Dr" : "Cr"}
                            </span>
                            <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ITEMS */}
                {matchedItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoCubeOutline className="text-xs" /> Items
                    </p>
                    {matchedItems.map((item) => {
                      const itemName = item.itemName || item.item_name || item.name;
                      const hsn = item.hsnCode || item.hsn_sac_code || item.hsn;
                      const qty = Number(item.current_stock ?? item.stockQuantity ?? 0);
                      const price = Number(item.salesPrice || item.sales_price || item.price || 0);

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigateTo(`/items/${item.id}`)}
                          className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                          style={rowStyle}
                          onMouseEnter={rowHoverIn}
                          onMouseLeave={rowHoverOut}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{itemName}</p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>
                              Stock: {qty} {item.unit || ""}{hsn ? ` • HSN: ${hsn}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-xs" style={{ color: "var(--gi-text)" }}>
                              ₹{price.toLocaleString("en-IN")}
                            </span>
                            <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PAYMENTS */}
                {matchedPayments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoReceiptOutline className="text-xs" /> Payments
                    </p>
                    {matchedPayments.map((pay) => {
                      const pName = pay.party?.partyName || pay.partyName || pay.party_name || "Payment Record";
                      const isCredit = pay.type === "credit" || pay.type === "payment_in";
                      const amount = Number(pay.amount || 0);

                      return (
                        <div
                          key={pay.id}
                          onClick={() => navigateTo(`/paymentDetails/${pay.id}`)}
                          className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                          style={rowStyle}
                          onMouseEnter={rowHoverIn}
                          onMouseLeave={rowHoverOut}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{pName}</p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>
                              {isCredit ? "Payment In" : "Payment Out"} • {pay.mode || pay.payment_mode || "Cash"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-xs" style={{ color: isCredit ? "var(--gi-success)" : "var(--gi-danger)" }}>
                              ₹{amount.toLocaleString("en-IN")}
                            </span>
                            <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STAFF */}
                {matchedStaff.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoPersonOutline className="text-xs" /> Staff
                    </p>
                    {matchedStaff.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => navigateTo("/staff")}
                        className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                        style={rowStyle}
                        onMouseEnter={rowHoverIn}
                        onMouseLeave={rowHoverOut}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{st.name || st.user_name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>
                            {st.role || st.user_type || "Staff"}{st.mobile || st.phone ? ` • ${st.mobile || st.phone}` : ""}
                          </p>
                        </div>
                        <IoChevronForward className="text-xs shrink-0" style={{ color: "var(--gi-text-muted)" }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* SITES */}
                {matchedSites.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoLocationOutline className="text-xs" /> Sites &amp; Projects
                    </p>
                    {matchedSites.map((sp) => (
                      <div
                        key={sp.id}
                        onClick={() => navigateTo("/siteProject")}
                        className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                        style={rowStyle}
                        onMouseEnter={rowHoverIn}
                        onMouseLeave={rowHoverOut}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{sp.name || sp.siteName || sp.projectName}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>
                            {sp.type || "Site"}{sp.location || sp.city || sp.address ? ` • ${sp.location || sp.city || sp.address}` : ""}
                          </p>
                        </div>
                        <IoChevronForward className="text-xs shrink-0" style={{ color: "var(--gi-text-muted)" }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* QUICK PAGES */}
                {quickPages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}>
                      <IoArrowForwardOutline className="text-xs" /> Quick Pages
                    </p>
                    {quickPages.map((page, idx) => {
                      const Icon = page.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => navigateTo(page.href)}
                          className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition"
                          style={rowStyle}
                          onMouseEnter={rowHoverIn}
                          onMouseLeave={rowHoverOut}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="text-sm shrink-0" style={{ color: "var(--gi-primary)" }} />
                            <span className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{page.title}</span>
                          </div>
                          <IoChevronForward className="text-xs shrink-0" style={{ color: "var(--gi-text-muted)" }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
