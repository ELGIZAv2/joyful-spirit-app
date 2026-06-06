// Pipedream Tool Registry — maps app slugs to OpenAI-style tool schemas and
// the HTTP request each tool should proxy through Pipedream Connect Proxy.
//
// The chat function discovers which apps the user has connected via the
// pipedream_accounts table, looks up the tools here for those apps, optionally
// filters by user-disabled toggles (pipedream_tool_settings), and exposes the
// resulting JSON-schema tools to the LLM. When the LLM calls a tool, the chat
// function asks the pipedream-proxy edge function to execute it.

export interface ToolHttpSpec {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  // URL template — replace {param} from the tool arguments.
  url: string;
  // Optional JSON body template. Each leaf can be either:
  //  - a literal value (string/number/boolean) → used as-is
  //  - "{argName}" → substituted from arguments
  //  - "{argName?}" → only included if the arg is provided
  // For richer transforms, set transform: "passthrough" and the body is the args themselves.
  bodyFrom?: "args" | Record<string, unknown> | null;
  // Optional query-string keys taken from arguments
  queryFrom?: string[];
  // Headers in addition to auth headers
  headers?: Record<string, string>;
}

export interface ToolDef {
  name: string;            // OpenAI tool name (snake_case, app-prefixed)
  appSlug: string;         // Must match pipedream_accounts.app_slug
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  http: ToolHttpSpec;
}

// Helper to build a JSON schema object
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });
const bool = (description: string) => ({ type: "boolean", description });

export const PIPEDREAM_TOOLS: ToolDef[] = [
  // ── Gmail ──
  {
    name: "gmail_send_email",
    appSlug: "gmail",
    description: "Send an email from the connected Gmail account.",
    parameters: obj({
      to: str("Recipient email address"),
      subject: str("Email subject"),
      body: str("Email body (plain text or HTML)"),
    }, ["to", "subject", "body"]),
    http: {
      method: "POST",
      url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      bodyFrom: "args",
    },
  },
  {
    name: "gmail_list_recent",
    appSlug: "gmail",
    description: "List the most recent emails in the user's Gmail inbox.",
    parameters: obj({
      maxResults: num("Number of messages to fetch (default 10, max 50)"),
      query: str("Optional Gmail search query (e.g. 'from:boss@x.com')"),
    }),
    http: {
      method: "GET",
      url: "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      queryFrom: ["maxResults", "q"],
    },
  },

  // ── Google Sheets ──
  {
    name: "google_sheets_read_range",
    appSlug: "google_sheets",
    description: "Read cells from a Google Sheets spreadsheet range (e.g. 'Sheet1!A1:D20').",
    parameters: obj({
      spreadsheetId: str("The Google Sheets spreadsheet ID"),
      range: str("A1 notation range, e.g. 'Sheet1!A1:D20'"),
    }, ["spreadsheetId", "range"]),
    http: {
      method: "GET",
      url: "https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}",
    },
  },
  {
    name: "google_sheets_append_row",
    appSlug: "google_sheets",
    description: "Append a row of values to a Google Sheets range.",
    parameters: obj({
      spreadsheetId: str("The spreadsheet ID"),
      range: str("Range like 'Sheet1!A1'"),
      values: { type: "array", items: { type: "array", items: { type: "string" } }, description: "2D array of row values" },
    }, ["spreadsheetId", "range", "values"]),
    http: {
      method: "POST",
      url: "https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append?valueInputOption=USER_ENTERED",
      bodyFrom: { values: "{values}" },
    },
  },

  // ── Google Calendar ──
  {
    name: "google_calendar_list_events",
    appSlug: "google_calendar",
    description: "List upcoming events from the user's primary Google Calendar.",
    parameters: obj({
      maxResults: num("Number of events to fetch (default 10)"),
      timeMin: str("RFC3339 lower bound; defaults to now if omitted"),
    }),
    http: {
      method: "GET",
      url: "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      queryFrom: ["maxResults", "timeMin"],
    },
  },
  {
    name: "google_calendar_create_event",
    appSlug: "google_calendar",
    description: "Create a new event on the user's primary Google Calendar.",
    parameters: obj({
      summary: str("Event title"),
      description: str("Event description"),
      start: str("RFC3339 start datetime"),
      end: str("RFC3339 end datetime"),
    }, ["summary", "start", "end"]),
    http: {
      method: "POST",
      url: "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      bodyFrom: {
        summary: "{summary}",
        description: "{description?}",
        start: { dateTime: "{start}" },
        end: { dateTime: "{end}" },
      },
    },
  },

  // ── Slack ──
  {
    name: "slack_post_message",
    appSlug: "slack",
    description: "Post a message to a Slack channel.",
    parameters: obj({
      channel: str("Channel ID or name (e.g. '#general' or 'C12345')"),
      text: str("Message text"),
    }, ["channel", "text"]),
    http: {
      method: "POST",
      url: "https://slack.com/api/chat.postMessage",
      bodyFrom: "args",
    },
  },

  // ── Discord ──
  {
    name: "discord_post_message",
    appSlug: "discord",
    description: "Send a message to a Discord channel via the connected webhook/bot.",
    parameters: obj({
      channelId: str("Discord channel ID"),
      content: str("Message content"),
    }, ["channelId", "content"]),
    http: {
      method: "POST",
      url: "https://discord.com/api/v10/channels/{channelId}/messages",
      bodyFrom: { content: "{content}" },
    },
  },

  // ── Notion ──
  {
    name: "notion_search",
    appSlug: "notion",
    description: "Search pages and databases in the connected Notion workspace.",
    parameters: obj({
      query: str("Search query"),
    }, ["query"]),
    http: {
      method: "POST",
      url: "https://api.notion.com/v1/search",
      bodyFrom: { query: "{query}" },
      headers: { "Notion-Version": "2022-06-28" },
    },
  },
  {
    name: "notion_create_page",
    appSlug: "notion",
    description: "Create a new page in a Notion parent (page or database).",
    parameters: obj({
      parentId: str("Notion parent page or database ID"),
      title: str("Page title"),
      content: str("Page content text"),
    }, ["parentId", "title"]),
    http: {
      method: "POST",
      url: "https://api.notion.com/v1/pages",
      bodyFrom: {
        parent: { page_id: "{parentId}" },
        properties: { title: { title: [{ text: { content: "{title}" } }] } },
      },
      headers: { "Notion-Version": "2022-06-28" },
    },
  },

  // ── Airtable ──
  {
    name: "airtable_list_records",
    appSlug: "airtable_oauth",
    description: "List records from an Airtable table.",
    parameters: obj({
      baseId: str("Airtable base ID (starts with 'app...')"),
      tableId: str("Airtable table ID or name"),
      maxRecords: num("Maximum records to return (default 25)"),
    }, ["baseId", "tableId"]),
    http: {
      method: "GET",
      url: "https://api.airtable.com/v0/{baseId}/{tableId}",
      queryFrom: ["maxRecords"],
    },
  },
  {
    name: "airtable_create_record",
    appSlug: "airtable_oauth",
    description: "Create a record in an Airtable table. Pass fields as a JSON object.",
    parameters: obj({
      baseId: str("Airtable base ID"),
      tableId: str("Airtable table ID or name"),
      fields: { type: "object", description: "Field values keyed by column name", additionalProperties: true },
    }, ["baseId", "tableId", "fields"]),
    http: {
      method: "POST",
      url: "https://api.airtable.com/v0/{baseId}/{tableId}",
      bodyFrom: { fields: "{fields}" },
    },
  },

  // ── GitHub (via Pipedream OAuth) ──
  {
    name: "github_list_repos",
    appSlug: "github",
    description: "List repositories the authenticated user has access to.",
    parameters: obj({
      perPage: num("Items per page, max 100 (default 30)"),
    }),
    http: {
      method: "GET",
      url: "https://api.github.com/user/repos",
      queryFrom: ["perPage"],
    },
  },
  {
    name: "github_create_issue",
    appSlug: "github",
    description: "Create an issue in a GitHub repository.",
    parameters: obj({
      owner: str("Repo owner (user or org)"),
      repo: str("Repository name"),
      title: str("Issue title"),
      body: str("Issue body (markdown)"),
    }, ["owner", "repo", "title"]),
    http: {
      method: "POST",
      url: "https://api.github.com/repos/{owner}/{repo}/issues",
      bodyFrom: { title: "{title}", body: "{body?}" },
    },
  },

  // ── Linear ──
  {
    name: "linear_create_issue",
    appSlug: "linear",
    description: "Create an issue in Linear via GraphQL.",
    parameters: obj({
      teamId: str("Linear team UUID"),
      title: str("Issue title"),
      description: str("Issue description (markdown)"),
    }, ["teamId", "title"]),
    http: {
      method: "POST",
      url: "https://api.linear.app/graphql",
      bodyFrom: {
        query: "mutation IssueCreate($input: IssueCreateInput!){ issueCreate(input:$input){ success issue { id identifier url title } } }",
        variables: { input: { teamId: "{teamId}", title: "{title}", description: "{description?}" } },
      },
    },
  },

  // ── HubSpot ──
  {
    name: "hubspot_create_contact",
    appSlug: "hubspot",
    description: "Create a contact in HubSpot CRM.",
    parameters: obj({
      email: str("Contact email"),
      firstname: str("First name"),
      lastname: str("Last name"),
    }, ["email"]),
    http: {
      method: "POST",
      url: "https://api.hubapi.com/crm/v3/objects/contacts",
      bodyFrom: { properties: { email: "{email}", firstname: "{firstname?}", lastname: "{lastname?}" } },
    },
  },

  // ── Telegram ──
  {
    name: "telegram_send_message",
    appSlug: "telegram_bot_api",
    description: "Send a message via the connected Telegram bot.",
    parameters: obj({
      chat_id: str("Telegram chat ID"),
      text: str("Message text"),
    }, ["chat_id", "text"]),
    http: {
      method: "POST",
      url: "https://api.telegram.org/bot/sendMessage",
      bodyFrom: "args",
    },
  },

  // ── Trello ──
  {
    name: "trello_create_card",
    appSlug: "trello",
    description: "Create a new card in a Trello list.",
    parameters: obj({
      idList: str("Trello list ID"),
      name: str("Card name"),
      desc: str("Card description"),
    }, ["idList", "name"]),
    http: {
      method: "POST",
      url: "https://api.trello.com/1/cards",
      queryFrom: ["idList", "name", "desc"],
    },
  },
];

// Build an OpenAI/Qwen-compatible tool list for the apps the user has connected
// and (optionally) enabled.
export function buildToolsForApps(
  connectedSlugs: Set<string>,
  disabledSlugs: Set<string>,
): { tools: any[]; defByName: Map<string, ToolDef> } {
  const tools: any[] = [];
  const defByName = new Map<string, ToolDef>();
  for (const def of PIPEDREAM_TOOLS) {
    if (!connectedSlugs.has(def.appSlug)) continue;
    if (disabledSlugs.has(def.appSlug)) continue;
    tools.push({
      type: "function",
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      },
    });
    defByName.set(def.name, def);
  }
  return { tools, defByName };
}

// Substitute "{key}" / "{key?}" templates against the args object.
function substitute(value: unknown, args: Record<string, any>): unknown {
  if (typeof value === "string") {
    const optMatch = value.match(/^\{(\w+)\?\}$/);
    if (optMatch) return args[optMatch[1]];
    const reqMatch = value.match(/^\{(\w+)\}$/);
    if (reqMatch) return args[reqMatch[1]];
    return value.replace(/\{(\w+)\??\}/g, (_, k) => String(args[k] ?? ""));
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, args));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const sub = substitute(v, args);
      // Drop undefined optional placeholders
      if (sub === undefined) continue;
      out[k] = sub;
    }
    return out;
  }
  return value;
}

// Resolve the final HTTP request from a tool spec + arguments
export function resolveRequest(def: ToolDef, args: Record<string, any>) {
  let url = def.http.url.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(String(args[k] ?? "")));
  if (def.http.queryFrom?.length) {
    const qs = new URLSearchParams();
    for (const k of def.http.queryFrom) {
      const v = args[k];
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const sep = url.includes("?") ? "&" : "?";
    const qStr = qs.toString();
    if (qStr) url = `${url}${sep}${qStr}`;
  }
  let body: unknown = undefined;
  if (def.http.bodyFrom === "args") body = args;
  else if (def.http.bodyFrom && typeof def.http.bodyFrom === "object") body = substitute(def.http.bodyFrom, args);
  return { url, method: def.http.method, body, headers: def.http.headers || {} };
}
