import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const uid = searchParams.get("uid");

    if (!db) {
      return NextResponse.json({
        error: "Firebase Firestore is not configured."
      }, { status: 500 });
    }

    if (!email && !uid) {
      return NextResponse.json({
        error: "Please provide either an '?email=...' or '?uid=...' query parameter."
      }, { status: 400 });
    }

    let userDocId = uid || "";

    if (email && !uid) {
      // Find the user with this email in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return NextResponse.json({
          error: `No user found in database with email: ${email}`
        }, { status: 404 });
      }

      userDocId = querySnapshot.docs[0].id;
    }

    // Update user's role to 'admin'
    const userDocRef = doc(db, "users", userDocId);
    await updateDoc(userDocRef, {
      role: "admin"
    });

    return NextResponse.json({
      success: true,
      message: `User with ID ${userDocId} has been successfully promoted to ADMIN role!`
    });

  } catch (error: any) {
    console.error("Setup Admin Error:", error);
    return NextResponse.json({
      error: error.message || "Failed to setup admin."
    }, { status: 500 });
  }
}
