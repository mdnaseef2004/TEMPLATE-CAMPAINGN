"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import FrameEditor from "@/components/FrameEditor";
import { Sparkles, Users, Award, Image as ImageIcon, Phone, User, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

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
}

export default function PublicCampaignPage() {
  const { slug } = useParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchCampaignBySlug = async () => {
      if (!slug) return;
      try {
        if (!supabase) {
          // Mock localStorage fetch
          const mockCampaignsStr = localStorage.getItem("mock_campaigns") || "[]";
          const allCampaigns: Campaign[] = JSON.parse(mockCampaignsStr);
          const found = allCampaigns.find((c) => c.slug === slug);
          if (!found) setNotFound(true);
          else setCampaign(found);
        } else {
          const { data, error } = await supabase
            .from("campaigns")
            .select("*")
            .eq("slug", slug)
            .single();

          if (error || !data) {
            setNotFound(true);
          } else {
            setCampaign({
              id: data.id,
              title: data.title,
              description: data.description,
              slug: data.slug,
              frameUrl: data.frame_url,
              bannerUrl: data.banner_url,
              creatorId: data.creator_id,
              spreadsheetId: data.spreadsheet_id || null,
              spreadsheetUrl: data.spreadsheet_url || null,
              participantCount: data.participant_count || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignBySlug();
  }, [slug]);

  const handleJoinCampaign = async () => {
    if (!name.trim() || !phoneNumber.trim() || !campaign) return;
    setJoining(true);

    try {
      if (!supabase) {
        // Mock localStorage join
        const participantsStr = localStorage.getItem("mock_participants") || "[]";
        const participants = JSON.parse(participantsStr);
        participants.push({
          campaignId: campaign.id,
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("mock_participants", JSON.stringify(participants));

        const allCampaigns = JSON.parse(localStorage.getItem("mock_campaigns") || "[]");
        localStorage.setItem("mock_campaigns", JSON.stringify(
          allCampaigns.map((c: any) =>
            c.id === campaign.id ? { ...c, participantCount: (c.participantCount || 0) + 1 } : c
          )
        ));
      } else {
        // Insert participant
        const { error: insertErr } = await supabase.from("participants").insert({
          campaign_id: campaign.id,
          name: name.trim(),
          phone_number: phoneNumber.trim(),
        });
        if (insertErr) throw insertErr;

        // Increment count via RPC
        await supabase.rpc("increment_participants", { campaign_id: campaign.id });

        // Google Sheets sync (optional)
        try {
          await fetch("/api/sheets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-spreadsheet-id": campaign.spreadsheetId || "",
            },
            body: JSON.stringify({
              name: name.trim(),
              phoneNumber: phoneNumber.trim(),
              campaignId: campaign.id,
              campaignTitle: campaign.title,
            }),
          });
        } catch (sheetSyncError) {
          console.error("Google Sheets sync failed (continuing):", sheetSyncError);
        }
      }

      setCampaign((prev) => prev ? { ...prev, participantCount: prev.participantCount + 1 } : null);

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setIsJoined(true);
    } catch (err) {
      console.error("Failed to submit participant:", err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center max-w-sm mx-auto gap-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">Campaign Not Found</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The campaign link you followed does not exist, or has been taken offline by its creator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto py-4">
      <div className="h-56 sm:h-72 w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-red-400 to-pink-500 shadow-xl border border-opacity-20">
        {campaign.bannerUrl ? (
          <img src={campaign.bannerUrl} alt={campaign.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <Sparkles className="w-12 h-12 text-white/55 animate-float" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-8">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold w-fit border border-white/10 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>{campaign.participantCount || 0} participants joined</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">{campaign.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-opacity-30 space-y-4">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              About Campaign
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {campaign.description || "No description provided."}
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-opacity-40 shadow-lg space-y-5">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Join Campaign
            </h3>

            {isJoined ? (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-success text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">You are registered!</p>
                  <p className="text-xs mt-1">Your participant logs have been recorded. Use the frame editor on the right to download your overlay photo.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2.5 px-4 rounded-xl border border-foreground/10 bg-foreground/5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +62812345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full py-2.5 px-4 rounded-xl border border-foreground/10 bg-foreground/5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
                  />
                </div>
                <button
                  onClick={handleJoinCampaign}
                  disabled={joining || !name.trim() || !phoneNumber.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {joining ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
                  ) : (
                    "Register & Unlock Editor"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="font-extrabold text-xl tracking-tight text-center mb-6">Frame Canvas Editor</h3>
          {isJoined ? (
            <FrameEditor frameUrl={campaign.frameUrl} campaignTitle={campaign.title} onSuccessSubmit={() => {}} />
          ) : (
            <div className="w-full max-w-[360px] aspect-square rounded-3xl glass-panel border border-opacity-30 flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-dashed">
              <Award className="w-12 h-12 text-primary opacity-50 mb-3" />
              <p className="font-bold text-sm text-foreground mb-1">Editor Locked</p>
              <p className="text-xs max-w-[240px]">Enter your Name and Phone Number to unlock the image merger.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
