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
import { useApp } from "@/context/AppContext";

export default function SearchBar({
  searchOptions = ["All", "Invoices", "Parties", "Items", "Payments", "Staff", "Sites"],
  placeholder = "Search invoices, parties, items, payments...",
  onSelectInvoice = null,
}) {
  const router = useRouter();
  const {
    invoices = [],
    parties = [],
    items = [],
    payments = [],
    staffList = [],
    siteProjects = [],
  } = useApp();

  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedOption, setSelectedOption] = useState(searchOptions[0] || "All");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const query = search.trim().toLowerCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchedInvoices = (selectedOption === "All" || selectedOption === "Invoices") && query
    ? invoices.filter((inv) => {
        const invNum = typeof inv.invoiceNumber === "object"
          ? `${inv.invoiceNumber?.prefix || ""} ${inv.invoiceNumber?.number || ""}`
          : String(inv.invoiceNumberStr || inv.invoiceNumber || "");
        const partyName = inv.partyName || inv.party?.partyName || inv.supplier?.partyName || "";
        return (
          invNum.toLowerCase().includes(query) ||
          partyName.toLowerCase().includes(query) ||
          (inv.invoiceType || inv.type || "").toLowerCase().includes(query) ||
          String(inv.totalAmount || "").includes(query)
        );
      }).slice(0, 6)
    : [];

  const matchedParties = (selectedOption === "All" || selectedOption === "Parties") && query
    ? parties.filter((p) =>
        p.partyName?.toLowerCase().includes(query) ||
        p.phone?.includes(query) ||
        p.gstNumber?.toLowerCase().includes(query) ||
        p.partyType?.toLowerCase().includes(query)
      ).slice(0, 6)
    : [];

  const matchedItems = (selectedOption === "All" || selectedOption === "Items") && query
    ? items.filter((item) =>
        (item.itemName || item.name)?.toLowerCase().includes(query) ||
        item.hsnCode?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      ).slice(0, 6)
    : [];

  const matchedPayments = (selectedOption === "All" || selectedOption === "Payments") && query
    ? payments.filter((pay) => {
        const pName = pay.party?.partyName || pay.partyName || "";
        return (
          pName.toLowerCase().includes(query) ||
          pay.mode?.toLowerCase().includes(query) ||
          String(pay.amount || "").includes(query)
        );
      }).slice(0, 6)
    : [];

  const matchedStaff = (selectedOption === "All" || selectedOption === "Staff") && query
    ? staffList.filter((st) =>
        st.name?.toLowerCase().includes(query) ||
        st.mobile?.includes(query) ||
        st.role?.toLowerCase().includes(query)
      ).slice(0, 5)
    : [];

  const matchedSites = (selectedOption === "All" || selectedOption === "Sites") && query
    ? siteProjects.filter((sp) =>
        sp.name?.toLowerCase().includes(query) ||
        sp.code?.toLowerCase().includes(query)
      ).slice(0, 5)
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

  const navigateTo = (url, invData = null) => {
    setFocused(false);
    setSearch("");
    if (invData && onSelectInvoice) {
      onSelectInvoice(invData);
    } else {
      router.push(url);
    }
  };

  // Shared row style helpers
  const rowStyle = { background: "var(--gi-surface-secondary)", border: "1px solid var(--gi-border)" };
  const rowHoverIn = (e) => { e.currentTarget.style.background = "var(--gi-hover)"; };
  const rowHoverOut = (e) => { e.currentTarget.style.background = "var(--gi-surface-secondary)"; };

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
          <button type="button" onClick={() => { setSearch(""); inputRef.current?.focus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--gi-text-muted)" }}>
            <IoClose className="text-sm" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl shadow-2xl" style={{ background: "var(--gi-surface)", border: "1px solid var(--gi-border)", maxHeight: "440px", overflowY: "auto" }}>
          {/* Category filter pills */}
          <div className="flex items-center gap-1 px-3 pt-2.5 pb-2 overflow-x-auto border-b" style={{ borderColor: "var(--gi-border)" }}>
            {searchOptions.map((opt) => (
              <button key={opt} type="button" onClick={() => setSelectedOption(opt)} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap cursor-pointer transition shrink-0 ${selectedOption === opt ? "gi-filter-active" : "gi-filter-inactive"}`}>
                {opt}
              </button>
            ))}
          </div>

          <div className="p-2 space-y-3">
            {totalResults === 0 ? (
              <div className="py-8 text-center">
                <IoSearch className="text-3xl mx-auto mb-2 opacity-30" style={{ color: "var(--gi-text-muted)" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--gi-text)" }}>No results for &quot;{search}&quot;</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--gi-text-muted)" }}>Try a party name, invoice number, or item code</p>
              </div>
            ) : (
              <>
                {/* INVOICES */}
                {matchedInvoices.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoDocumentTextOutline className="text-xs" /> Invoices</p>
                    {matchedInvoices.map((inv) => {
                      const invNum = typeof inv.invoiceNumber === "object"
                        ? `${inv.invoiceNumber?.prefix || ""} ${inv.invoiceNumber?.number || ""}`
                        : String(inv.invoiceNumberStr || inv.invoiceNumber || "INV");
                      const partyName = inv.partyName || inv.party?.partyName || inv.supplier?.partyName || "Party";
                      const isSales = (inv.invoiceType || inv.type) === "sales";
                      return (
                        <div key={inv.id} onClick={() => navigateTo("/invoice", inv)} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{invNum}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isSales ? "gi-badge-success" : "gi-badge-info"}`}>{isSales ? "Sales" : "Purchase"}</span>
                            </div>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>{partyName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-xs" style={{ color: "var(--gi-text)" }}>₹{Number(inv.totalAmount || 0).toLocaleString("en-IN")}</span>
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
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoPeopleOutline className="text-xs" /> Parties</p>
                    {matchedParties.map((p) => (
                      <div key={p.id} onClick={() => navigateTo(`/parties/${p.id}`)} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{p.partyName}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>{p.partyType || "Customer"}{p.phone ? ` • ${p.phone}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-semibold text-xs" style={{ color: Number(p.closingBalance || 0) >= 0 ? "var(--gi-success)" : "var(--gi-danger)" }}>₹{Math.abs(Number(p.closingBalance || 0)).toLocaleString("en-IN")}</span>
                          <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ITEMS */}
                {matchedItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoCubeOutline className="text-xs" /> Items</p>
                    {matchedItems.map((item) => (
                      <div key={item.id} onClick={() => navigateTo(`/items/${item.id}`)} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{item.itemName || item.name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>Stock: {item.stockQuantity || 0} {item.unit || ""}{item.hsnCode ? ` • HSN: ${item.hsnCode}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-xs" style={{ color: "var(--gi-text)" }}>₹{Number(item.salesPrice || item.price || 0).toLocaleString("en-IN")}</span>
                          <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* PAYMENTS */}
                {matchedPayments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoReceiptOutline className="text-xs" /> Payments</p>
                    {matchedPayments.map((pay) => (
                      <div key={pay.id} onClick={() => navigateTo("/paymentHistory")} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{pay.party?.partyName || pay.partyName || "Payment"}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>{pay.type === "credit" ? "Payment In" : "Payment Out"} • {pay.mode || "Cash"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-xs" style={{ color: pay.type === "credit" ? "var(--gi-success)" : "var(--gi-danger)" }}>₹{Number(pay.amount || 0).toLocaleString("en-IN")}</span>
                          <IoChevronForward className="text-xs" style={{ color: "var(--gi-text-muted)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* STAFF */}
                {matchedStaff.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoPersonOutline className="text-xs" /> Staff</p>
                    {matchedStaff.map((st) => (
                      <div key={st.id} onClick={() => navigateTo("/staff")} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{st.name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>{st.role || "Staff"} • {st.mobile}</p>
                        </div>
                        <IoChevronForward className="text-xs shrink-0" style={{ color: "var(--gi-text-muted)" }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* SITES */}
                {matchedSites.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoLocationOutline className="text-xs" /> Sites & Projects</p>
                    {matchedSites.map((sp) => (
                      <div key={sp.id} onClick={() => navigateTo("/siteProject")} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--gi-text)" }}>{sp.name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--gi-text-secondary)" }}>{sp.type || "Site"}{sp.address ? ` • ${sp.address}` : ""}</p>
                        </div>
                        <IoChevronForward className="text-xs shrink-0" style={{ color: "var(--gi-text-muted)" }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* QUICK PAGES */}
                {quickPages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider px-1 flex items-center gap-1" style={{ color: "var(--gi-text-muted)" }}><IoArrowForwardOutline className="text-xs" /> Pages</p>
                    {quickPages.map((page, idx) => {
                      const Icon = page.icon;
                      return (
                        <div key={idx} onClick={() => navigateTo(page.href)} className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition" style={rowStyle} onMouseEnter={rowHoverIn} onMouseLeave={rowHoverOut}>
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