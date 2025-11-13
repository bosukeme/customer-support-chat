import axios from "axios";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

console.log(API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});


export const chatApi = {

  async startConversation() {
    const response = await api.post("/api/chat/conversations/", {});
    console.log(response);

    const conversationId = response.data.id;
    return conversationId;

  },

  async getConversations() {
    const res = await api.get("/api/chat/conversations/");
    const data = res.data;
    return data;
  },
  
  // Fetch message history for a given conversation
  async getMessages(conversationId: string) {
    const res = await api.get(`/api/chat/messages/${conversationId}/`);
    return res.data;
  },

  // Fetch all agent conversations
  async getAgentConversations() {
    const res = await api.get("/api/chat/agents/conversations/");
    return res.data;
  },

  // Accept a conversation
  async acceptConversation(convId: string) {
    return api.post(`/api/chat/agents/accept/${convId}/`);
  },

  // Close a conversation
  async closeConversation(convId: string) {
    return api.post(`/api/chat/agents/close/${convId}/`);
  },
};