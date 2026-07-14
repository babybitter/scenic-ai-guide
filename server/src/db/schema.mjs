export const schema = {
  adminUsers: {
    description: "Admin and operator accounts.",
    columns: {
      id: "text primary key",
      username: "text unique not null",
      password_hash: "text not null",
      role: "text not null",
      created_at: "datetime not null"
    }
  },
  visitorSessions: {
    description: "Anonymous visitor sessions.",
    columns: {
      id: "text primary key",
      started_at: "datetime not null",
      ended_at: "datetime",
      channel: "text",
      satisfaction_score: "integer"
    }
  },
  messages: {
    description: "Visitor and digital-human conversation messages.",
    columns: {
      id: "text primary key",
      session_id: "text not null",
      role: "text not null",
      content: "text not null",
      intent_label: "text",
      emotion_label: "text",
      latency_ms: "integer",
      created_at: "datetime not null"
    }
  },
  knowledgeDocuments: {
    description: "Uploaded source documents.",
    columns: {
      id: "text primary key",
      file_name: "text not null",
      file_type: "text not null",
      status: "text not null",
      chunk_count: "integer default 0",
      created_at: "datetime not null"
    }
  },
  knowledgeChunks: {
    description: "RAG-ready chunks with retrieval metadata.",
    columns: {
      id: "text primary key",
      document_id: "text not null",
      scenic_spot_id: "text",
      title: "text",
      content: "text not null",
      keywords: "json",
      embedding_ref: "text",
      created_at: "datetime not null"
    }
  },
  scenicSpots: {
    description: "Structured Lingshan scenic spot records.",
    columns: {
      id: "text primary key",
      name: "text not null",
      aliases: "json",
      location_text: "text",
      parameters: "text",
      core_function: "text",
      culture: "text",
      detail: "text",
      highlights: "text",
      open_info: "text",
      notes: "text"
    }
  },
  routes: {
    description: "Personalized tour route definitions and selections.",
    columns: {
      id: "text primary key",
      name: "text not null",
      route_type: "text not null",
      duration_minutes: "integer",
      node_ids: "json not null",
      tags: "json",
      created_at: "datetime not null"
    }
  },
  digitalHumanConfigs: {
    description: "Digital human image, voice and behavior settings.",
    columns: {
      id: "text primary key",
      name: "text not null",
      character_asset: "text",
      voice_id: "text",
      speech_rate: "real",
      welcome_text: "text",
      emotion_style: "text",
      enabled: "boolean default false"
    }
  },
  feedback: {
    description: "Visitor ratings and text feedback.",
    columns: {
      id: "text primary key",
      session_id: "text not null",
      score: "integer",
      sentiment: "text",
      content: "text",
      created_at: "datetime not null"
    }
  },
  touristBehavior: {
    description: "Official Excel behavior and consumption analysis data.",
    columns: {
      id: "text primary key",
      tourist_id: "text",
      age: "integer",
      gender: "text",
      attraction_name: "text",
      visit_date: "date",
      stay_duration: "real",
      ticket_cost: "real",
      food_cost: "real",
      shopping_cost: "real",
      transport_cost: "real",
      entertainment_cost: "real",
      total_cost: "real",
      group_size: "integer",
      satisfaction: "integer"
    }
  }
};
