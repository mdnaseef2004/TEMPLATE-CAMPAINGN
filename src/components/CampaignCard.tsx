"use client";

import { useState } from "react";
import { Users, Share2, FileSpreadsheet, Trash2, ExternalLink, Download, Check } from "lucide-react";
import { exportToCsv } from "@/utils/exportCsv";
import { supabase } from "@/supabase/client";

interface Campaign {
  id: string;
  title: string;
  description: string;
  slug: string;
  frameUrl: string;
  bannerUrl: string;
  creatorId: string;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  participantCount: number;
  createdAt: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (id: string) => void;
}

export default function CampaignCard({ campaign, onDelete }: CampaignCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getPublicUrl = () => {
    if (typeof window !== "undefined") return `${window.location.origin}/c/${campaign.slug}`;
    return `/c/${campaign.slug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPublicUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleSheetClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (campaign.spreadsheetId === "mock-sheet-id") {
      e.preventDefault();
      alert("📊 Google Sheets Sync is Simulated!\n\nYou are in Offline Mock Mode. Download participant CSV instead.");
    }
  };

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    try {
      let participantsData: { Name: string; "Phone Number": string; "Date Joined": string }[] = [];

      if (!supabase) {
        // Mock localStorage
        const participantsStr = localStorage.getItem("mock_participants") || "[]";
        const all = JSON.parse(participantsStr);
        participantsData = all
          .filter((p: any) => p.campaignId === campaign.id)
          .map((p: any) => ({
            Name: p.name || "",
            "Phone Number": p.phoneNumber || "",
            "Date Joined": p.createdAt ? new Date(p.createdAt).toLocaleString() : "",
          }));
      } else {
        const { data, error } = await supabase
          .from("participants")
          .select("name, phone_number, created_at")
          .eq("campaign_id", campaign.id);

        if (error) throw error;

        participantsData = (data || []).map((row: any) => ({
          Name: row.name || "",
          "Phone Number": row.phone_number || "",
          "Date Joined": row.created_at ? new Date(row.created_at).toLocaleString() : "",
        }));
      }

      if (participantsData.length === 0) {
        alert("This campaign does not have any participants yet.");
      } else {
        exportToCsv(participantsData, `${campaign.slug}-participants.csv`);
      }
    } catch (error) {
      console.error("Error fetching participants for CSV:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-panel overflow-hidden rounded-2xl flex flex-col h-full border border-opacity-40 transition-all hover:translate-y-[-4px] hover:shadow-xl">
      <div className="h-40 w-full relative overflow-hidden bg-gradient-to-r from-red-500 via-pink-500 to-orange-400">
        {campaign.bannerUrl ? (
          <img src={campaign.bannerUrl} alt={campaign.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <span className="text-white font-semibold text-lg drop-shadow-md">{campaign.title}</span>
          </div>
        )}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold border border-white/15">
          <Users className="w-3.5 h-3.5" />
          <span>{campaign.participantCount || 0} joined</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1.5" title={campaign.title}>
            {campaign.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {campaign.description || "No description provided."}
          </p>
        </div>

        <div>
          <div className="mb-4">
            {campaign.spreadsheetUrl ? (
              <a href={campaign.spreadsheetUrl} target="_blank" rel="noopener noreferrer"
                onClick={handleSheetClick}
                className="inline-flex items-center gap-1.5 text-xs text-success hover:underline font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Google Sheet Connected
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5 opacity-60" />
                Sheet Sync Offline (CSV Available)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-primary/20 bg-primary-light hover:bg-primary-light/80 text-primary text-xs font-bold transition-all active:scale-95">
              {copied ? (<><Check className="w-3.5 h-3.5" />Copied</>) : (<><Share2 className="w-3.5 h-3.5" />Copy Link</>)}
            </button>
            <button onClick={handleDownloadCsv} disabled={isExporting}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-foreground/10 hover:bg-foreground/5 text-foreground text-xs font-bold transition-all active:scale-95 disabled:opacity-50">
              {isExporting ? (
                <div className="w-3.5 h-3.5 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download CSV
            </button>
          </div>

          <div className="border-t border-opacity-10 pt-3 flex justify-end">
            {showConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger font-medium">Are you sure?</span>
                <button onClick={() => onDelete(campaign.id)}
                  className="py-1 px-2.5 rounded-lg bg-danger text-white text-xs font-bold hover:bg-danger-hover transition-colors">
                  Yes, Delete
                </button>
                <button onClick={() => setShowConfirmDelete(false)}
                  className="py-1 px-2.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 text-foreground text-xs font-medium transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-red-500 opacity-60 hover:opacity-100 font-semibold transition-all hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
