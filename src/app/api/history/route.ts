import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// In-memory / server-side persistence store keyed by userId (extensible to database)
const serverHistoryStore = new Map<
  string,
  {
    conversations: unknown[];
    messagesByConversation: Record<string, unknown[]>;
    activeConversationId?: string;
    updatedAt: number;
  }
>();

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userHistory = serverHistoryStore.get(userId);
    if (!userHistory) {
      return NextResponse.json({
        conversations: [],
        messagesByConversation: {},
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json(userHistory);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch cloud history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversations, messagesByConversation, activeConversationId } = body;

    serverHistoryStore.set(userId, {
      conversations: Array.isArray(conversations) ? conversations : [],
      messagesByConversation: typeof messagesByConversation === "object" ? messagesByConversation : {},
      activeConversationId,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, syncedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync cloud history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    serverHistoryStore.delete(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to clear cloud history" },
      { status: 500 }
    );
  }
}
