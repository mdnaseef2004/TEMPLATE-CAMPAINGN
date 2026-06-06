"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase/client";
import CampaignCard from "@/components/CampaignCard";
import { LayoutGrid, PlusCircle, Users, Link2, Upload, FileText, Image as ImageIcon, Sparkles } from "lucide-react";

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

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoadingCampaigns(true);
    try {
      let list: Campaign[] = [];
      let participantsSum = 0;

      if (!supabase) {
        // Mock localStorage fetch
        const mockCampaignsStr = localStorage.getItem("mock_campaigns") || "[]";
        const allCampaigns: Campaign[] = JSON.parse(mockCampaignsStr);
        list = allCampaigns.filter((c) => c.creatorId === user.uid);
        participantsSum = list.reduce((sum, c) => sum + (c.participantCount || 0), 0);
      } else {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("creator_id", user.uid)
          .order("created_at", { ascending: false });

        if (error) throw error;

        list = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          slug: row.slug,
          frameUrl: row.frame_url,
          bannerUrl: row.banner_url,
          creatorId: row.creator_id,
          spreadsheetId: row.spreadsheet_id,
          spreadsheetUrl: row.spreadsheet_url,
          participantCount: row.participant_count || 0,
          createdAt: row.created_at,
        }));
        participantsSum = list.reduce((sum, c) => sum + (c.participantCount || 0), 0);
      }

      setCampaigns(list);
      setTotalParticipants(participantsSum);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (user) fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  }, [title]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!user) return;
    if (!frameFile) {
      setFormError("A Campaign Frame PNG is required.");
      return;
    }

    setSubmitting(true);
    try {
      const campaignId = Math.random().toString(36).substring(2, 11);

      if (!supabase) {
        // Mock localStorage creation
        const mockCampaignsStr = localStorage.getItem("mock_campaigns") || "[]";
        const allCampaigns: any[] = JSON.parse(mockCampaignsStr);

        const slugExists = allCampaigns.some((c) => c.slug === slug.trim());
        if (slugExists) {
          setFormError("This Campaign URL slug is already taken.");
          setSubmitting(false);
          return;
        }

        const fileToBase64 = (file: File): Promise<string> =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });

        const frameUrl = await fileToBase64(frameFile);
        const bannerUrl = bannerFile ? await fileToBase64(bannerFile) : "";

        allCampaigns.push({
          id: campaignId,
          title: title.trim(),
          description: description.trim(),
          slug: slug.trim(),
          frameUrl,
          bannerUrl,
          creatorId: user.uid,
          creatorName: user.displayName || "Creator",
          spreadsheetId: "mock-sheet-id",
          spreadsheetUrl: "https://docs.google.com/spreadsheets/d/mock-sheet-id/edit",
          participantCount: 0,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("mock_campaigns", JSON.stringify(allCampaigns));
      } else {
        // 1. Check slug uniqueness
        const { data: existing } = await supabase
          .from("campaigns")
          .select("id")
          .eq("slug", slug.trim())
          .single();

        if (existing) {
          setFormError("This Campaign URL slug is already taken.");
          setSubmitting(false);
          return;
        }

        // 2. Upload frame to Supabase Storage
        const frameExt = frameFile.name.split(".").pop();
        const framePath = `frames/${user.uid}/${campaignId}-frame.${frameExt}`;
        const { error: frameErr } = await supabase.storage
          .from("campaign-assets")
          .upload(framePath, frameFile, { upsert: true });
        if (frameErr) throw frameErr;

        const { data: frameData } = supabase.storage
          .from("campaign-assets")
          .getPublicUrl(framePath);
        const frameUrl = frameData.publicUrl;

        // 3. Upload banner (optional)
        let bannerUrl = "";
        if (bannerFile) {
          const bannerExt = bannerFile.name.split(".").pop();
          const bannerPath = `banners/${user.uid}/${campaignId}-banner.${bannerExt}`;
          await supabase.storage
            .from("campaign-assets")
            .upload(bannerPath, bannerFile, { upsert: true });
          const { data: bannerData } = supabase.storage
            .from("campaign-assets")
            .getPublicUrl(bannerPath);
          bannerUrl = bannerData.publicUrl;
        }

        // 4. Google Sheets integration (optional)
        let spreadsheetId = null;
        let spreadsheetUrl = null;
        try {
          const sheetsApiRes = await fetch("/api/sheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "TwibbonCraft Initializer",
              phoneNumber: "0000000000",
              campaignId,
              campaignTitle: title.trim(),
              creatorEmail: user.email,
            }),
          });
          const sheetData = await sheetsApiRes.json();
          if (sheetData.success && sheetData.sheetSync) {
            spreadsheetId = sheetData.spreadsheetId;
            spreadsheetUrl = sheetData.spreadsheetUrl;
          }
        } catch (sheetsError) {
          console.error("Sheets init failed, continuing:", sheetsError);
        }

        // 5. Insert campaign row
        const { error: insertErr } = await supabase.from("campaigns").insert({
          title: title.trim(),
          description: description.trim(),
          slug: slug.trim(),
          frame_url: frameUrl,
          banner_url: bannerUrl,
          creator_id: user.uid,
          creator_name: user.displayName,
          spreadsheet_id: spreadsheetId,
          spreadsheet_url: spreadsheetUrl,
          participant_count: 0,
        });
        if (insertErr) throw insertErr;
      }

      setTitle("");
      setDescription("");
      setSlug("");
      setFrameFile(null);
      setBannerFile(null);
      const frameInput = document.getElementById("frame-input") as HTMLInputElement;
      const bannerInput = document.getElementById("banner-input") as HTMLInputElement;
      if (frameInput) frameInput.value = "";
      if (bannerInput) bannerInput.value = "";

      setFormSuccess("Campaign launched successfully!");
      fetchCampaigns();
    } catch (error: any) {
      console.error("Campaign creation error:", error);
      setFormError(error.message || "Failed to create campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      if (!supabase) {
        const mockCampaignsStr = localStorage.getItem("mock_campaigns") || "[]";
        const allCampaigns: Campaign[] = JSON.parse(mockCampaignsStr);
        localStorage.setItem("mock_campaigns", JSON.stringify(allCampaigns.filter((c) => c.id !== id)));
        setCampaigns(campaigns.filter((c) => c.id !== id));
      } else {
        const { error } = await supabase.from("campaigns").delete().eq("id", id);
        if (error) throw error;
        setCampaigns(campaigns.filter((c) => c.id !== id));
      }
      fetchCampaigns();
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      alert(`Failed to delete campaign. Error: ${error.message || JSON.stringify(error)}`);
    }
  };

  if (loading || (loadingCampaigns && campaigns.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="font-bold text-foreground">{user?.displayName}</span>! Create and share campaigns.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-panel py-3.5 px-5 rounded-2xl border border-opacity-30 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-2xl font-extrabold">{campaigns.length}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Campaigns</span>
            </div>
          </div>

          <div className="glass-panel py-3.5 px-5 rounded-2xl border border-opacity-30 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-2xl font-extrabold">{totalParticipants}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Joins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Your Active Campaigns
          </h3>

          {campaigns.length === 0 ? (
            <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-opacity-30">
              <PlusCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg text-foreground mb-1">No campaigns active</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                You haven&apos;t created any frame campaigns yet. Complete the creation wizard to launch your first public link!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((camp) => (
                <CampaignCard key={camp.id} campaign={camp} onDelete={handleDeleteCampaign} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Create Campaign
          </h3>

          <div className="glass-panel p-6 rounded-2xl border border-opacity-40 shadow-xl space-y-6">
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-danger text-xs font-semibold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-success text-xs font-semibold animate-pulse">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indonesian Independence Day"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl border border-foreground/10 bg-foreground/5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  Campaign Slug URL
                </label>
                <div className="flex rounded-xl overflow-hidden border border-foreground/10 bg-foreground/5 text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light transition-all">
                  <span className="py-2.5 pl-4 pr-1 text-muted-foreground bg-foreground/5 select-none font-medium text-xs flex items-center">
                    /c/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                    className="w-full py-2.5 pr-4 pl-0.5 bg-transparent border-0 outline-none font-bold text-primary focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Campaign Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell your audience what this frame supports..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl border border-foreground/10 bg-foreground/5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Transparent Frame PNG (1080x1080 default)
                </label>
                <input
                  type="file"
                  id="frame-input"
                  required
                  accept="image/png"
                  onChange={(e) => { if (e.target.files) setFrameFile(e.target.files[0]); }}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-light file:text-primary hover:file:bg-primary-light/80 file:cursor-pointer cursor-pointer border border-foreground/10 rounded-xl p-1"
                />
                <p className="text-[10px] text-muted-foreground">Frame must be a transparent PNG for overlays to align.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Campaign Banner (Optional)
                </label>
                <input
                  type="file"
                  id="banner-input"
                  accept="image/*"
                  onChange={(e) => { if (e.target.files) setBannerFile(e.target.files[0]); }}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-light file:text-primary hover:file:bg-primary-light/80 file:cursor-pointer cursor-pointer border border-foreground/10 rounded-xl p-1"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-75"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Launching Campaign...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Launch Campaign
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
