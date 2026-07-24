import { createClient } from "@libsql/client";

async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error("❌ NOTION_TOKEN is not defined in your .env file.");
    process.exit(1);
  }

  let parentPageId = process.env.NOTION_PAGE_ID;
  let parentPageTitle = "Shared Page";

  if (parentPageId) {
    parentPageId = parentPageId.replace(/-/g, "");
    if (parentPageId.length === 32) {
      parentPageId = `${parentPageId.substring(0, 8)}-${parentPageId.substring(8, 12)}-${parentPageId.substring(12, 16)}-${parentPageId.substring(16, 20)}-${parentPageId.substring(20)}`;
    }
    console.log(`🎯 Using target parent page ID from .env: ${parentPageId}`);
  } else {
    console.log("🔍 Searching for shared Notion pages...");
    const searchRes = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: { property: "object", value: "page" },
      }),
    });

    const searchJson = await searchRes.json();
    if (searchJson.error) {
      console.error("❌ Notion Search API Error:", searchJson.message);
      process.exit(1);
    }

    const results = searchJson.results || [];
    if (results.length === 0) {
      console.log("\n⚠️  No shared pages found!");
      console.log("Please share a page with your Notion integration first:");
      console.log("1. Open any page in Notion (or create a new one).");
      console.log("2. Click the three dots (...) or 'Share' in the top right corner.");
      console.log("3. Go to 'Add connections' and search for your integration.");
      console.log("4. Once shared, run this script again.\n");
      process.exit(0);
    }

    const parentPage = results[0];
    parentPageId = parentPage.id;
    parentPageTitle = parentPage.properties?.title?.title?.[0]?.plain_text || "Untitled Page";
    console.log(`✅ Found shared parent page: "${parentPageTitle}" (ID: ${parentPageId})`);
  }

  console.log("🚀 Creating the Database...");
  const createDbRes = await fetch("https://api.notion.com/v1/databases", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: {
        type: "page_id",
        page_id: parentPageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: "Vour Carousels Content Calendar",
          },
        },
      ],
      properties: {
        Topic: {
          title: {},
        },
        Status: {
          select: {
            options: [
              { name: "Ready", color: "green" },
              { name: "Scheduled", color: "blue" },
              { name: "Draft", color: "gray" },
            ],
          },
        },
      },
    }),
  });

  const dbJson = await createDbRes.json();
  if (dbJson.object === "error") {
    console.error("❌ Failed to create database:", dbJson.message);
    process.exit(1);
  }

  const databaseId = dbJson.id;
  console.log(`✅ Database created successfully! ID: ${databaseId}`);

  // Adding the two example topics
  const topics = [
    "Mengenal Firecracker VM: Rahasia Dibalik Cepatnya Serverless AWS",
    "Mengapa bcrypt Sangat Aman untuk Hash Password: Cara Kerja & Salt",
  ];

  console.log("✍️  Adding example topics to database...");
  for (const topic of topics) {
    const pageRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties: {
          Topic: {
            title: [
              {
                text: {
                  content: topic,
                },
              },
            ],
          },
          Status: {
            select: {
              name: "Ready",
            },
          },
        },
      }),
    });

    const pageJson = await pageRes.json();
    if (pageJson.object === "error") {
      console.warn(`⚠️  Failed to add topic "${topic}":`, pageJson.message);
    } else {
      console.log(`   + Added: "${topic}"`);
    }
  }

  console.log("\n🎉 Setup complete!");
  console.log("You can find the database inside your Notion page.");
  console.log(`Database ID for your n8n workflow: ${databaseId}\n`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
});
