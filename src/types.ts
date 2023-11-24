export type KnowledgeBase = {
  id: number;
  owner_id: number;
  name: string;
  created: string;
  updated: string;
  knowledges: Knowledge[];
};

export type Knowledge = {
  id: number;
  name: string;
  created: string;
  updated: string;
  available: boolean;
};