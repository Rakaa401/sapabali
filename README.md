SapaBali — AI-Powered Cultural & Destination Intelligence Platform
An AI-powered destination intelligence and cultural communication platform designed to help visitors understand Bali's cultural heritage, local customs, and destination-specific information.

Target Competition: Bali DigiFest 2026
Development Period: October 30 – November 7, 2026
Project Type: AI-Powered Web Application
Status: MVP / Competition Submission
1. Project Overview
SapaBali is an AI-powered destination intelligence platform designed to bridge the communication and information gap between Bali's cultural heritage destinations, local communities, destination staff, and international visitors.

Visitors often struggle to find reliable information about local customs, cultural etiquette, dress codes, sacred areas, and destination-specific rules. Language barriers can make these challenges more difficult, potentially leading to misunderstandings and inappropriate visitor behavior.

SapaBali addresses these challenges through a centralized knowledge platform supported by Retrieval-Augmented Generation (RAG).

The platform provides three main AI capabilities:
- AI Cultural Guide: Helps visitors ask questions about a destination and receive contextual answers grounded in available destination knowledge.
- Staff Assistant: Helps destination staff communicate local rules and cultural information in clear English.
- AI Knowledge Structuring: Assists administrators in transforming unstructured source information into structured knowledge records.
SapaBali also provides an administrative dashboard for managing destinations, knowledge content, publication workflows, and AI-related operations.
2. Key Features
Visitor Experience
- Destination-specific landing pages.
- Public visitor guide and cultural information.
- Destination knowledge browsing.
- Indonesian and English language support where content is available.
- QR-code access to destination information.
- AI-powered Cultural Guide.
- Knowledge source references in AI responses.
- Safe fallback responses for unsupported questions.
AI Cultural Guide
The AI Cultural Guide allows visitors to ask questions about a specific destination.

Its main capabilities include:
- Natural-language question processing.
- Contextual knowledge retrieval using RAG.
- Destination-specific information filtering.
- Grounded AI-generated answers.
- Source references from retrieved knowledge.
- Unsupported-question handling to reduce fabricated information.
Staff Assistant
The Staff Assistant helps destination staff explain local customs, visitor rules, and cultural information to international visitors.

Features include:
- Situation-based input.
- Contextual knowledge retrieval.
- English explanation generation.
- Copy generated responses.
- AI-generated explanations based on available destination knowledge.
Admin Dashboard
Administrators can manage the platform through a protected dashboard.

Main management capabilities include:
- Dashboard statistics.
- Destination management.
- Knowledge Base management.
- Knowledge creation and editing.
- Draft and publication workflows.
- AI-powered knowledge structuring.
- AI request logs where implemented.
- Administrative settings where implemented.
3. Technology Stack
Category	Technology
Framework	Next.js 16 (App Router)
Language	TypeScript
Styling	Tailwind CSS
UI Icons	Lucide React
Database	Supabase PostgreSQL
Authentication	Supabase Auth
Vector Search	pgvector
LLM Provider	Google Gemini
AI Integration	Gemini API
Deployment	Vercel
Version Control	Git and GitHub


4. System Architecture
SapaBali follows a web application architecture consisting of a frontend, server-side API layer, database, and AI services.
Architecture Overview
                       SAPABALI
                           |
             +-------------+-------------+
             |                           |
        PUBLIC USERS                 ADMIN USERS
             |                           |
       Visitor Interface            Admin Dashboard
             |                           |
             +-------------+-------------+
                           |
                     NEXT.JS APP
                           |
                   Server-side APIs
                           |
             +-------------+-------------+
             |             |             |
          Supabase     Gemini API    RAG Service
             |                           |
        PostgreSQL                 Embedding Service
             |                           |
          pgvector <---------------------+
             |
        Knowledge Base
Main Application Components
Frontend

Provides visitor-facing pages, AI interfaces, and administrative interfaces.

Backend

Handles API requests, authentication, authorization, database operations, AI requests, and knowledge retrieval.

Database

Stores destination information, knowledge records, embeddings, administrator records, and AI logs.

AI Services

Process natural-language requests, structure knowledge, generate embeddings, and produce contextual responses.
5. Database Structure
SapaBali uses Supabase PostgreSQL as its primary database. Database schema changes are maintained as SQL migration files in supabase/migrations/.

The migration files create or modify the following tables:
Table	Purpose
destinations	Stores destination information and metadata.
knowledge_items	Stores structured destination knowledge, source information, language, and indexing status.
knowledge_chunks	Stores processed knowledge chunks and vector embeddings.
knowledge_categories	Stores knowledge category names, slugs, and descriptions.
admin_users	Stores administrator profiles and authorization roles.
ai_logs	Stores AI request and response records, token usage, and execution information.
activity_logs	Records administrator activities and changes to knowledge and destinations.
visitor_chat_rate_limits	Stores visitor chat rate-limit counters.


Database Relationships
- A destination can be associated with multiple knowledge items.
- A knowledge item can contain multiple knowledge chunks.
- Knowledge chunks reference their original knowledge records.
- Administrator records are associated with Supabase Auth users.
- Activity logs can reference the administrator responsible for an action.
- AI logs can reference the authenticated administrator when applicable.
Knowledge Indexing
Knowledge items use an indexing_status field to track indexing progress.

The migration files define these supported values:
- pending
- indexing
- indexed
- failed
- stale
Public knowledge retrieval is restricted by publication and indexing status. Published knowledge must be successfully indexed and associated with a published destination to be available through the public knowledge retrieval policies.
Vector Storage
SapaBali uses the PostgreSQL pgvector extension for semantic search.

The knowledge chunk embedding column uses a vector dimension of 768. Vector similarity search is implemented through the match_knowledge_chunks database function.

Row Level Security (RLS) is enabled on the relevant tables to enforce database access restrictions.
6. AI Implementation
SapaBali integrates Google Gemini for AI-powered features.
AI Knowledge Structuring
The Knowledge Structuring feature helps administrators convert unstructured information into structured knowledge.

General workflow:
1. Administrator enters raw source information.
2. The application sends the input to the Gemini service.
3. Gemini generates structured knowledge output.
4. The application validates the generated response.
5. Administrator reviews and edits the result.
6. Approved content can be saved as a draft.
AI-generated content requires administrator review before publication.
AI Cultural Guide
The Cultural Guide combines semantic knowledge retrieval with Gemini response generation.

The model receives relevant destination knowledge as context to help generate grounded answers.
Staff Assistant
The Staff Assistant uses destination knowledge as contextual information when generating English explanations for visitor-facing situations.

AI-generated content is intended to assist communication rather than replace official destination policies or human judgment.
7. Retrieval-Augmented Generation (RAG)
SapaBali implements a Retrieval-Augmented Generation architecture to improve the relevance and grounding of AI responses.
Knowledge Indexing Flow
Knowledge Creation
       |
       v
Content Preprocessing
       |
       v
Text Chunking
       |
       v
Embedding Generation
       |
       v
Vector Storage
       |
       v
PostgreSQL + pgvector
Retrieval Flow
Visitor Question
       |
       v
Query Embedding
       |
       v
Vector Similarity Search
       |
       v
Destination & Publication Filters
       |
       v
Relevant Knowledge Chunks
       |
       v
Context Construction
       |
       v
Gemini Response Generation
       |
       v
Grounded Answer + Sources
RAG Principles
- Retrieve information relevant to the requested destination.
- Use published and successfully indexed knowledge where required.
- Provide retrieved context to the language model.
- Return source references based on actual retrieval results.
- Avoid generating factual destination rules without sufficient supporting information.
- Provide a safe fallback when relevant information cannot be retrieved.
8. Project Structure
The project follows a modular Next.js App Router structure.
sapabali/
├── public/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   └── ...
│   ├── components/
│   │   ├── admin/
│   │   ├── ai-structuring/
│   │   └── ui/
│   ├── lib/
│   │   ├── ai/
│   │   ├── rag/
│   │   └── supabase/
│   └── types/
├── supabase/
│   └── migrations/
├── .env.example
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
9. Getting Started
Prerequisites
Before running SapaBali locally, make sure you have:
- Node.js compatible with the project requirements.
- npm.
- A Supabase project.
- A Google Gemini API key.
- Git.
Installation
Clone the repository:
git clone https://github.com/Rakaa401/sapabali.git
Navigate to the project directory:
cd sapabali
Install dependencies:
npm install
Environment Variables
Create a .env.local file in the project root.

Use .env.example as the reference for the required configuration and replace the placeholder values with your own credentials.

The application source references the following environment variables:
Variable	Purpose
NEXT_PUBLIC_SUPABASE_URL	Supabase project URL used by the application.
NEXT_PUBLIC_SUPABASE_ANON_KEY	Public Supabase client key.
SUPABASE_SERVICE_ROLE_KEY	Server-side Supabase service-role credential. Keep this secret.
GEMINI_API_KEY	API key for Google Gemini services.
AI_PROVIDER	AI provider configuration.
GEMINI_MODEL	Gemini model used for AI generation.
GEMINI_FALLBACK_MODELS	Fallback Gemini models.
GEMINI_EMBEDDING_MODEL	Gemini embedding model used for knowledge indexing.
NEXT_PUBLIC_SITE_URL	Public base URL of the application. Use the local URL during development.
AI_MOCK	Controls mock AI behavior for development or testing.
CHAT_RATE_LIMIT_SALT	Secret salt used by visitor chat rate limiting.
VISITOR_CHAT_GLOBAL_HOURLY_LIMIT	Configures the global hourly visitor chat limit.


NODE_ENV is also referenced by the application and is normally managed by the Next.js runtime.

Example configuration:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GEMINI_API_KEY=your_gemini_api_key
AI_PROVIDER=your_ai_provider
GEMINI_MODEL=your_gemini_model
GEMINI_FALLBACK_MODELS=your_fallback_models
GEMINI_EMBEDDING_MODEL=your_embedding_model

NEXT_PUBLIC_SITE_URL=http://localhost:3000
AI_MOCK=false

CHAT_RATE_LIMIT_SALT=replace_with_a_long_random_secret
VISITOR_CHAT_GLOBAL_HOURLY_LIMIT=your_hourly_limit
Check .env.example for the project's intended values and defaults before running the application. Do not assume the illustrative placeholders above are valid production values.

Never commit .env.local or expose secret API credentials in client-side code. In particular, keep GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, and CHAT_RATE_LIMIT_SALT server-side.
Database Setup
SapaBali uses Supabase PostgreSQL. Database schema changes, indexes, functions, triggers, and Row Level Security policies are maintained in supabase/migrations/.

Setup procedure:
1. Create a Supabase project.
2. Configure the required Supabase environment variables.
3. Ensure the pgvector extension is available in the database.
4. Review the SQL migration files in supabase/migrations/.
5. Apply the migrations using the database migration workflow configured for the project, in the intended order.
6. Configure Supabase Auth and create the required administrator account.
7. Verify database access, RLS policies, and application connectivity.
Use the migration files as the source of truth for the database schema. Do not manually recreate tables that are already defined by the migrations.

Before applying migrations to an existing production database, review its migration history and verify that the changes are safe to apply.
Run Locally
Start the development server:
npm run dev
Open:
http://localhost:3000
Production Build
Run linting:
npm run lint
Create an optimized production build:
npm run build
Start the production server locally:
npm run start
10. Deployment
SapaBali is designed to be deployed using Vercel.

General deployment steps:
1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the production environment variables.
4. Verify Supabase connectivity.
5. Deploy the application.
6. Verify public routes and administrative authentication.
7. Test AI endpoints and database operations in production.
Public Demo
Production URL: Not yet verified. Add the public deployment URL after deployment and verification.

Source Code: https://github.com/Rakaa401/sapabali

The production URL should be verified before competition submission.
11. Screenshots
Screenshots of the actual application have not yet been included in this README.

When screenshots are available, place the image files in public/screenshots/ and embed the actual files here using Markdown image references. Only list or embed screenshots that exist in the repository and represent the actual application interface.

Suggested screenshots to capture:
Suggested filename	Description
public/screenshots/homepage.png	Public landing page.
public/screenshots/destination.png	Destination information page.
public/screenshots/visitor-guide.png	Visitor Guide interface.
public/screenshots/ai-cultural-guide.png	AI Cultural Guide conversation.
public/screenshots/staff-assistant.png	Staff Assistant interface.
public/screenshots/admin-dashboard.png	Admin dashboard.
public/screenshots/knowledge-management.png	Knowledge management interface.
public/screenshots/ai-structuring.png	AI Knowledge Structuring interface.


12. Limitations
SapaBali is developed as an MVP for Bali DigiFest 2026.

The following limitations should be considered:
- AI response quality depends on the accuracy and completeness of the available knowledge base.
- Unsupported questions may not receive a definitive answer.
- AI-generated explanations require human review when used for official communication.
- Missing translations depend on the availability of reviewed language-specific content.
- AI availability depends on external provider uptime, quotas, and API access.
- Semantic retrieval quality depends on embedding quality, content preprocessing, and indexing.
- The platform does not independently verify every piece of submitted destination information.
- The MVP does not replace official destination authorities or local cultural experts.
13. Third-Party Services & Credits
SapaBali uses the following third-party technologies and services:
- Next.js — Web application framework.
- React — User interface library.
- Tailwind CSS — Styling framework.
- Lucide React — Icon library.
- Supabase — Database, authentication, and backend services.
- PostgreSQL — Relational database.
- pgvector — Vector similarity search.
- Google Gemini — Large language model services.
- Vercel — Application hosting and deployment.
Destination information and knowledge sources should be credited individually through their source metadata.

All third-party services remain subject to their respective licenses and terms of service.
14. Project Information
Project: SapaBali
Competition: Bali DigiFest 2026
Repository: https://github.com/Rakaa401/sapabali
Developer: SapaBali Development Team
Built to make cultural knowledge more accessible, contextual, and understandable for visitors