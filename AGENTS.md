<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# General Agent Rules
1. **DO NOT BE LAZY**: Scan everything thoroughly. Fix all issues immediately but be intelligent about it. Never apply partial fixes.
2. **Holistic Implementation**: When implementing a feature or fixing a bug, DO NOT stop at the backend API. You MUST aggressively search for and update all correlating files across the entire stack. For instance, if you add an API endpoint to change an email, you must also find the frontend UI that previously blocked email changes and update it to use the new feature. Never apply a supposed fix without finding and updating all connected parts of the application.
3. **Strict Rider Data Isolation (Confirmation Codes)**: Riders MUST NOT see the order confirmation code under any circumstances, including email notifications. The confirmation code is a security measure meant exclusively for the customer to provide to the rider *in person* upon delivery. Ensure that all notification logic, API endpoints, and payload structures explicitly omit the confirmation code when delivering information to a rider.
