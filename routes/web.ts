/**
 * Web Routes
 * 
 * All application routes are defined here using the type-safe NaraRouter.
 * Routes can use middleware arrays for authentication and authorization.
 */
import { createRouter } from "@core";
import AuthController from "@controllers/AuthController";
import UserController from "@controllers/UserController";
import OAuthController from "@controllers/OAuthController";
import HomeController from "@controllers/HomeController";
import AssetController from "@controllers/AssetController";
import ProjectController from "@controllers/ProjectController";
import DashboardController from "@controllers/DashboardController";
import ProjectMemberController from "@controllers/ProjectMemberController";
import BatchController from "@controllers/BatchController";
import TaskController from "@controllers/TaskController";
import TaskCommentController from "@controllers/TaskCommentController";
import WorkspaceController from "@controllers/WorkspaceController";
import WorkspaceInvitationController from "@controllers/WorkspaceInvitationController";
import WorkspaceChatController from "@controllers/WorkspaceChatController";
import NotificationController from "@controllers/NotificationController";
import Auth from "@middlewares/auth";
import { strictRateLimit } from "@middlewares/rateLimit";

const Route = createRouter();

/**
 * Public Routes
 * These routes are accessible without authentication
 * ------------------------------------------------
 * GET  / - Home page
 */
Route.get("/", HomeController.index);

/**
 * Authentication Routes
 * Routes for handling user authentication
 * ------------------------------------------------
 * GET   /login - Login page
 * POST  /login - Process login
 * GET   /register - Registration page
 * POST  /register - Process registration
 * POST  /logout - Logout user
 */
Route.get("/login", AuthController.loginPage);
Route.post("/login", strictRateLimit(), AuthController.processLogin);
Route.get("/register", AuthController.registerPage);
Route.post("/register", strictRateLimit(), AuthController.processRegister);
Route.post("/logout", AuthController.logout);

/**
 * OAuth Routes
 * Routes for third-party authentication
 * ------------------------------------------------
 * GET   /google/redirect - Google OAuth redirect
 * GET   /google/callback - Google OAuth callback
 */
Route.get("/google/redirect", OAuthController.googleRedirect);
Route.get("/google/callback", OAuthController.googleCallback);

/**
 * Protected Routes
 * These routes require authentication
 * ------------------------------------------------
 * GET    /dashboard       - User dashboard
 * GET    /users           - Users management page
 * GET    /profile         - User profile
 * POST   /change-profile  - Update profile
 * POST   /change-password - Change password
 * POST   /users           - Create user (admin only)
 * PUT    /users/:id       - Update user (admin only)
 * DELETE /users           - Delete users (admin only)
 */
Route.get("/dashboard", [Auth], DashboardController.index);

Route.get("/projects", [Auth], ProjectController.index);
Route.post("/projects", [Auth], ProjectController.store);
Route.get("/projects/:id", [Auth], ProjectController.show);
Route.get("/projects/:id/activity", [Auth], ProjectController.activity);
Route.patch("/projects/:id", [Auth], ProjectController.update);
Route.delete("/projects/:id", [Auth], ProjectController.destroy);

Route.post("/projects/:id/members", [Auth], ProjectMemberController.store);
Route.delete("/projects/:id/members/:userId", [Auth], ProjectMemberController.destroy);

Route.get("/projects/:id/batches", [Auth], BatchController.index);
Route.post("/projects/:id/batches", [Auth], BatchController.store);
Route.patch("/projects/:id/batches/:batchId/activate", [Auth], BatchController.activate);

Route.post("/projects/:id/tasks", [Auth], TaskController.store);
Route.patch("/tasks/:id/move", [Auth], TaskController.move);
Route.post("/tasks/:id/logs", [Auth], TaskController.addLog);
Route.delete("/tasks/:id", [Auth], TaskController.destroy);
Route.get("/tasks/:id/logs", [Auth], TaskController.getLogs);
Route.get("/tasks/:id/comments", [Auth], TaskCommentController.index);
Route.post("/tasks/:id/comments", [Auth], TaskCommentController.store);
Route.delete("/tasks/:id/comments/:commentId", [Auth], TaskCommentController.destroy);
Route.get("/workspaces", [Auth], WorkspaceController.index);
Route.post("/workspaces", [Auth], WorkspaceController.store);
Route.get("/workspaces/:id", [Auth], WorkspaceController.show);
Route.patch("/workspaces/:id", [Auth], WorkspaceController.update);
Route.delete("/workspaces/:id", [Auth], WorkspaceController.destroy);
Route.post("/workspaces/:id/invite", [Auth], WorkspaceController.invite);
Route.delete("/workspaces/:id/invitations/:invitationId", [Auth], WorkspaceController.cancelInvite);
Route.delete("/workspaces/:id/members/:userId", [Auth], WorkspaceController.removeMember);

Route.post("/invitations/:token/respond", [Auth], WorkspaceInvitationController.respond);

Route.get("/workspaces/:id/messages", [Auth], WorkspaceChatController.index);
Route.post("/workspaces/:id/messages", [Auth], WorkspaceChatController.store);

Route.get("/notifications", [Auth], NotificationController.index);
Route.patch("/notifications/:id/read", [Auth], NotificationController.markRead);
Route.post("/notifications/mark-all-read", [Auth], NotificationController.markAllRead);

Route.get("/users", [Auth], UserController.usersPage);
Route.get("/profile", [Auth], UserController.profilePage);
Route.post("/change-profile", [Auth], UserController.changeProfile);
Route.post("/change-password", [Auth], AuthController.changePassword);
Route.post("/users", [Auth], UserController.createUser);
Route.put("/users/:id", [Auth], UserController.updateUser);
Route.delete("/users", [Auth], UserController.deleteUsers);

// Avatar upload endpoint (local storage) - rate limited to prevent abuse
Route.post("/assets/avatar", [Auth, strictRateLimit()], AssetController.uploadAsset);

/**
 * Static Asset Handling Routes
 * 
 * 1. Dist Assets (/assets/:file)
 * Serves compiled and bundled assets from the dist/assets directory
 * - Handles JavaScript files (*.js) with proper content type
 * - Handles CSS files (*.css) with proper content type
 * - Implements in-memory caching for better performance
 * - Sets long-term browser cache headers (1 year)
 * Example URLs:
 * - /assets/app.1234abc.js
 * - /assets/main.5678def.css
 */
Route.get("/assets/:file", AssetController.distFolder);

/**
 * 2. Public & Storage Assets (/*) - Catch-all Route
 * Serves static files from public and storage directories
 * - Must be the LAST route in the file
 * - Only serves files with allowed extensions
 * - Returns 404 for paths without extensions
 * - Implements security checks against unauthorized access
 *
 * Allowed file types:
 * - Images: .ico, .png, .jpeg, .jpg, .gif, .svg, .webp
 * - Documents: .txt, .pdf
 * - Fonts: .woff, .woff2, .ttf, .eot
 * - Media: .mp4, .webm, .mp3, .wav
 * - Web: .css, .js
 *
 * Example URLs:
 * - /public/images/logo.png
 * - /storage/avatars/user-1.webp
 */
Route.get("/public/*", AssetController.publicFolder);
Route.get("/storage/*", AssetController.publicFolder);

// Export the underlying HyperExpress router for mounting to the server
export default Route.getRouter();