"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import type { UserRole } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  company: [
    { label: "顧問を探す", href: "/company/search" },
    { label: "マイページ", href: "/company/mypage" },
    { label: "チャット", href: "/company/chat" },
  ],
  advisor: [
    { label: "ダッシュボード", href: "/advisor/dashboard" },
    { label: "チャット", href: "/advisor/chat" },
    { label: "プロフィール", href: "/advisor/profile/edit" },
  ],
  admin: [
    { label: "ダッシュボード", href: "/admin/dashboard" },
    { label: "顧問承認", href: "/admin/approvals" },
    { label: "ユーザー", href: "/admin/users" },
    { label: "リクエスト", href: "/admin/requests" },
    { label: "マッチング", href: "/admin/matches" },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  company: "企業",
  advisor: "顧問",
  admin: "管理者",
};

export function Header() {
  const { user, role, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = role ? NAV_ITEMS[role] : [];

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="border-b border-[#E5E7EB] bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 font-heading text-xl font-bold tracking-tight text-[#0F569D]"
        >
          オニカナ顧問マッチング
        </Link>

        {/* Desktop Navigation */}
        {!loading && user && role && (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "font-semibold text-[#0F569D]"
                    : "text-[#6B7280] hover:text-[#1A1A2E]"
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-3 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full bg-[#0F569D]" />
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          ) : user && role ? (
            <>
              {/* Desktop user info */}
              <div className="hidden items-center gap-3 md:flex">
                <span className="text-sm font-medium text-[#1A1A2E]">
                  {user.display_name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[role]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={signOut}
                  aria-label="ログアウト"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>

              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      aria-label="メニューを開く"
                    />
                  }
                >
                  <Menu className="size-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0">
                  <SheetHeader className="border-b border-[#E5E7EB] px-5 py-4">
                    <SheetTitle className="text-left font-heading text-base font-bold text-[#0F569D]">
                      メニュー
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col px-3 py-4">
                    <div className="mb-4 flex items-center gap-2 px-2">
                      <span className="text-sm font-medium text-[#1A1A2E]">
                        {user.display_name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[role]}
                      </Badge>
                    </div>
                    <nav className="flex flex-col gap-1">
                      {navItems.map((item) => (
                        <SheetClose
                          key={item.href}
                          render={
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive(item.href)
                                  ? "bg-[#E8F0FE] font-semibold text-[#0F569D]"
                                  : "text-[#6B7280] hover:bg-gray-50 hover:text-[#1A1A2E]"
                              )}
                            />
                          }
                        >
                          {item.label}
                        </SheetClose>
                      ))}
                    </nav>
                    <div className="mt-4 border-t border-[#E5E7EB] pt-4 px-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-[#6B7280]"
                        onClick={() => {
                          setMobileOpen(false);
                          signOut();
                        }}
                      >
                        <LogOut className="size-4" />
                        ログアウト
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                ログイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
