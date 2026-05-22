"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DetailTabs({
  reviewCount,
  profile,
  achievements,
  reviews,
}: {
  reviewCount: number;
  profile: ReactNode;
  achievements: ReactNode;
  reviews: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList variant="line">
        <TabsTrigger value="profile">プロフィール</TabsTrigger>
        <TabsTrigger value="achievements">支援実績</TabsTrigger>
        <TabsTrigger value="reviews">レビュー ({reviewCount})</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">{profile}</TabsContent>
      <TabsContent value="achievements">{achievements}</TabsContent>
      <TabsContent value="reviews">{reviews}</TabsContent>
    </Tabs>
  );
}
