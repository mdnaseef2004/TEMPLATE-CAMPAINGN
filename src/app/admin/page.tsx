"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase/client";
import { Shield, Users, LayoutGrid, Award, Trash2, Key, RefreshCw, FileSpreadsheet } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AdminCampaign {
  id: string;
  title: string;
  slug: string;
  creatorName: string;
  participantCount: number;
  spreadsheetUrl: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [campaignsList, setCampaignsList] = useState<AdminCampaign[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/dashboard");
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    if (!user || user.role !== "admin") return;
    setLoadingData(true);

    try {
      let users: AdminUser[] = [];
      let campaigns: AdminCampaign[] = [];
      let participantsSum = 0;

      if (!supabase) {
        // Mock localStorage
        const mockUsersStr = localStorage.getItem("mock_users") || "[]";
        users = JSON.parse(mockUsersStr).map((u: any) => ({
          id: u.uid,
          email: u.email || "",
          displayName: u.displayName || "",
          role: u.role || "user",
          createdAt: u.createdAt || new Date().toISOString(),
        }));

        const mockCampaignsStr = localStorage.getItem("mock_campaigns") || "[]";
        campaigns = JSON.parse(mockCampaignsStr).map((c: any) => ({
          id: c.id,
          title: c.title || "",
          slug: c.slug || "",
          creatorName: c.creatorName || "Creator",
          participantCount: c.participantCount || 0,
          spreadsheetUrl: c.spreadsheetUrl || null,
          createdAt: c.createdAt || new Date().toISOString(),
        }));
        participantsSum = campaigns.reduce((sum, c) => sum + (c.participantCount || 0), 0);
      } else {
        // Fetch profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        users = (profilesData || []).map((row: any) => ({
          id: row.id,
          email: row.email || "",
          displayName: row.display_name || "",
          role: row.role || "user",
          createdAt: row.created_at || "",
        }));

        // Fetch campaigns
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });

        campaigns = (campaignsData || []).map((row: any) => ({
          id: row.id,
          title: row.title || "",
          slug: row.slug || "",
          creatorName: row.creator_name || "Creator",
          participantCount: row.participant_count || 0,
          spreadsheetUrl: row.spreadsheet_url || null,
          createdAt: row.created_at || "",
        }));
        participantsSum = campaigns.reduce((sum, c) => sum + (c.participantCount || 0), 0);
      }

      setUsersList(users);
      setTotalUsers(users.length);
      setCampaignsList(campaigns);
      setTotalCampaigns(campaigns.length);
      setTotalParticipants(participantsSum);
    } catch (error) {
      console.error("Admin data fetch error:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleToggleRole = async (userId: string, currentRole: "admin" | "user") => {
    if (userId === user?.uid) {
      alert("You cannot demote yourself from the admin role.");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      if (!supabase) {
        const mockUsersStr = localStorage.getItem("mock_users") || "[]";
        const users = JSON.parse(mockUsersStr);
        localStorage.setItem("mock_users", JSON.stringify(users.map((u: any) => u.uid === userId ? { ...u, role: newRole } : u)));
        setUsersList(usersList.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
        if (error) throw error;
        setUsersList(usersList.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error("Error toggling role:", error);
      alert("Failed to toggle role. Please try again.");
    }
  };

  const handleDeleteUserDoc = async (userId: string) => {
    if (userId === user?.uid) { alert("You cannot delete your own admin account."); return; }
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      if (!supabase) {
        const users: any[] = JSON.parse(localStorage.getItem("mock_users") || "[]");
        localStorage.setItem("mock_users", JSON.stringify(users.filter((u) => u.uid !== userId)));
        setUsersList(usersList.filter((u) => u.id !== userId));
        setTotalUsers(totalUsers - 1);
      } else {
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) throw error;
        setUsersList(usersList.filter((u) => u.id !== userId));
        setTotalUsers(totalUsers - 1);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      if (!supabase) {
        const campaigns: any[] = JSON.parse(localStorage.getItem("mock_campaigns") || "[]");
        localStorage.setItem("mock_campaigns", JSON.stringify(campaigns.filter((c) => c.id !== campaignId)));
      } else {
        const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
        if (error) throw error;
      }
      const campaign = campaignsList.find((c) => c.id === campaignId);
      setCampaignsList(campaignsList.filter((c) => c.id !== campaignId));
      setTotalCampaigns(totalCampaigns - 1);
      setTotalParticipants(totalParticipants - (campaign?.participantCount || 0));
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert("Failed to delete campaign.");
    }
  };

  if (loading || (loadingData && usersList.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  return (
    <div className="flex flex-col gap-10 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-warning" />
            Admin Panel
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Global system statistics, database monitoring, and user role management.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-foreground/10 hover:bg-foreground/5 text-foreground text-xs font-bold transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-opacity-30 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-3xl font-extrabold leading-none mb-1">{totalUsers}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Registered Users</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-opacity-30 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-3xl font-extrabold leading-none mb-1">{totalCampaigns}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Campaigns</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-opacity-30 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-3xl font-extrabold leading-none mb-1">{totalParticipants}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Participants Joined</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-panel p-6 rounded-2xl border border-opacity-30 space-y-6">
          <h3 className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Management
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-foreground/10 text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-2">User details</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr) => (
                  <tr key={usr.id} className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                    <td className="py-3 pr-2">
                      <p className="font-bold text-foreground">{usr.displayName || "No Name"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{usr.email}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        usr.role === "admin"
                          ? "bg-warning/15 text-warning border border-warning/20"
                          : "bg-primary-light text-primary border border-primary/20"
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right space-x-2">
                      <button onClick={() => handleToggleRole(usr.id, usr.role)} disabled={usr.id === user?.uid}
                        className="p-1.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 text-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-30" title="Toggle Admin Privilege">
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteUserDoc(usr.id)} disabled={usr.id === user?.uid}
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-30" title="Delete User">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-opacity-30 space-y-6">
          <h3 className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Global Campaigns
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-foreground/10 text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-2">Campaign details</th>
                  <th className="pb-3 px-2">Joined</th>
                  <th className="pb-3 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaignsList.map((camp) => (
                  <tr key={camp.id} className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                    <td className="py-3 pr-2">
                      <p className="font-bold text-foreground line-clamp-1">{camp.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">by {camp.creatorName}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-primary">{camp.participantCount}</span>
                    </td>
                    <td className="py-3 pl-2 text-right space-x-2">
                      {camp.spreadsheetUrl && (
                        <a href={camp.spreadsheetUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-block p-1.5 rounded-lg border border-green-500/20 bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-all hover:scale-105 active:scale-95" title="Open Sheet">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all hover:scale-105 active:scale-95" title="Delete Campaign">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
