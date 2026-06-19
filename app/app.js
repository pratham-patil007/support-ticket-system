// Dynamic API Host detection: use local port when testing locally, otherwise use Render production URL
const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://support-ticket-system-0jle.onrender.com";

// Application State
let token = localStorage.getItem("access_token") || null;
let currentUser = null;
try {
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
        currentUser = JSON.parse(userStr);
    }
} catch (e) {
    console.error("Failed to parse user session", e);
}

// ON INITIAL LOAD
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    if (token && currentUser) {
        setupAppWorkspace();
    } else {
        logoutUser(); // Reset to clean state
    }
});

// UI UTILS
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-custom toast-${type}`;
    
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <div class="toast-content">${message}</div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons(); // Initialize the new icon

    // Slide out and remove toast
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%) scale(0.9)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function switchAuthTab(tab) {
    document.getElementById("tabLogin").classList.toggle("active", tab === "login");
    document.getElementById("tabRegister").classList.toggle("active", tab === "register");
    
    document.getElementById("loginFormSection").style.display = tab === "login" ? "block" : "none";
    document.getElementById("registerFormSection").style.display = tab === "register" ? "block" : "none";
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebarContainer");
    sidebar.classList.toggle("active");
    
    const toggleIcon = document.querySelector("#sidebarToggle i");
    if (sidebar.classList.contains("active")) {
        toggleIcon.setAttribute("data-lucide", "x");
    } else {
        toggleIcon.setAttribute("data-lucide", "menu");
    }
    lucide.createIcons();
}

function showSection(id) {
    // Hide mobile sidebar if active
    const sidebar = document.getElementById("sidebarContainer");
    if (sidebar.classList.contains("active")) {
        toggleMobileSidebar();
    }

    // Toggle active link styling
    document.querySelectorAll(".sidebar-menu li").forEach(li => {
        li.classList.remove("active");
    });
    
    const targetMenuItem = document.getElementById(`menuItem-${id}`);
    if (targetMenuItem) {
        targetMenuItem.classList.add("active");
    }

    // Toggle section visibility
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    const targetSection = document.getElementById(id);
    if (targetSection) {
        targetSection.classList.add("active");
    }
}

// SESSION MANAGEMENT
function setupAppWorkspace() {
    // Hide Auth, Show Main App
    document.getElementById("authWrapper").style.display = "none";
    document.getElementById("appWorkspace").style.display = "flex";

    // Set User Profile Card
    document.getElementById("userNameLabel").innerText = currentUser.name || currentUser.email;
    document.getElementById("userRoleBadge").innerText = currentUser.role;
    
    const roleBadge = document.getElementById("userRoleBadge");
    roleBadge.className = `user-role-badge role-${currentUser.role}`;
    
    // Set Avatar letter
    const firstLetter = (currentUser.name || currentUser.email || "P").substring(0, 1).toUpperCase();
    document.getElementById("avatarLetter").innerText = firstLetter;

    // Set Dynamic Welcome text
    document.getElementById("welcomeHeading").innerText = `Welcome Back, ${currentUser.name || 'User'}!`;
    document.getElementById("welcomeSub").innerText = currentUser.role === "admin" 
        ? "Here's an administrative overview of the support ticket queues."
        : "Here's the current status of your submitted support tickets.";

    // Apply role specific UI visibility rules
    if (currentUser.role === "admin") {
        document.querySelectorAll(".customer-only").forEach(el => el.style.display = "none");
        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");
        document.getElementById("thCreatedBy").style.display = "";
        document.getElementById("ticketSectionTitle").innerText = "Support Ticket Console";
        document.getElementById("ticketSectionSub").innerText = "Full system-wide view of all customer support requests";
        document.getElementById("quickActionText").innerText = "Review tickets, change progress statuses, and troubleshoot customer problems directly from the console logs.";
    } else {
        document.querySelectorAll(".customer-only").forEach(el => el.style.display = "");
        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
        document.getElementById("thCreatedBy").style.display = "none";
        document.getElementById("ticketSectionTitle").innerText = "My Support Tickets";
        document.getElementById("ticketSectionSub").innerText = "Submit and track details of your technical support requests";
        document.getElementById("quickActionText").innerText = "Need technical assistance or want to report an issue? Open a new support ticket and our team will get back to you shortly.";
    }

    // Refresh Icons and load data
    lucide.createIcons();
    loadTickets();
}

function logoutUser() {
    token = null;
    currentUser = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");

    document.getElementById("authWrapper").style.display = "flex";
    document.getElementById("appWorkspace").style.display = "none";
}

// API INTEGRATION

// Register
async function registerUser() {
    const nameVal = document.getElementById("rname").value.trim();
    const emailVal = document.getElementById("remail").value.trim();
    const passVal = document.getElementById("rpassword").value;
    const roleVal = document.getElementById("rrole").value;

    if (!nameVal || !emailVal || !passVal) {
        showToast("Please fill in all registration fields", "error");
        return;
    }

    if (passVal.length < 6) {
        showToast("Password must be at least 6 characters long", "error");
        return;
    }

    try {
        const response = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: nameVal,
                email: emailVal,
                password: passVal,
                role: roleVal
            })
        });

        const data = await response.json();
        
        if (response.ok && data.message === "User registered") {
            showToast("Registration successful! Please log in.", "success");
            // Clear inputs
            document.getElementById("rname").value = "";
            document.getElementById("remail").value = "";
            document.getElementById("rpassword").value = "";
            
            // Switch tabs
            switchAuthTab("login");
            document.getElementById("lemail").value = emailVal;
        } else {
            showToast(data.message || data.detail || "Registration failed", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Could not contact the backend auth API server.", "error");
    }
}

// Login
async function loginUser() {
    const emailVal = document.getElementById("lemail").value.trim();
    const passVal = document.getElementById("lpassword").value;

    if (!emailVal || !passVal) {
        showToast("Please enter email and password", "error");
        return;
    }

    try {
        const response = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: emailVal,
                password: passVal
            })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            token = data.access_token;
            currentUser = data.user;
            
            localStorage.setItem("access_token", token);
            localStorage.setItem("current_user", JSON.stringify(currentUser));
            
            showToast(`Logged in successfully as ${currentUser.name}!`, "success");
            
            // Clear inputs
            document.getElementById("lemail").value = "";
            document.getElementById("lpassword").value = "";
            
            setupAppWorkspace();
        } else {
            showToast(data.message || data.detail || "Login credentials failed", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Could not contact the backend auth API server.", "error");
    }
}

// Create Ticket
async function createTicket() {
    const titleVal = document.getElementById("ticketTitle").value.trim();
    const prioVal = document.getElementById("ticketPriority").value;
    const descVal = document.getElementById("ticketDescription").value.trim();

    if (!titleVal || !descVal) {
        showToast("Please provide a title and detailed description", "error");
        return;
    }

    try {
        const response = await fetch(`${API}/tickets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: titleVal,
                description: descVal,
                priority: prioVal
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Support ticket submitted successfully!", "success");
            
            // Clear fields
            document.getElementById("ticketTitle").value = "";
            document.getElementById("ticketDescription").value = "";
            document.getElementById("ticketPriority").value = "Medium";
            
            // Switch to tickets list
            showSection("tickets");
            loadTickets();
        } else {
            showToast(data.detail || "Failed to submit ticket", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Failed to communicate with ticket creation service.", "error");
    }
}

// Load Tickets
async function loadTickets() {
    if (!token) return;

    try {
        const response = await fetch(`${API}/tickets`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showToast("Session expired, please log in again", "error");
                logoutUser();
            } else {
                showToast("Could not fetch support ticket logs", "error");
            }
            return;
        }

        const tickets = await response.json();
        
        // Filter values
        const priorityFilter = document.getElementById("filterPriority").value;
        const statusFilter = document.getElementById("filterStatus").value;

        // Filter tickets
        const filteredTickets = tickets.filter(ticket => {
            const prioMatch = (priorityFilter === "all" || ticket.priority === priorityFilter);
            const statusMatch = (statusFilter === "all" || ticket.status === statusFilter);
            return prioMatch && statusMatch;
        });

        // Update Statistics Counters
        updateStatistics(tickets);

        // Populate Ticket Table
        populateTable(filteredTickets);
        
        // Populate Dashboard Recent Tickets
        populateDashboardRecent(tickets);

    } catch (e) {
        console.error(e);
        showToast("Failed to connect to ticket database server.", "error");
    }
}

function updateStatistics(tickets) {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === "Open").length;
    const progress = tickets.filter(t => t.status === "In Progress").length;
    const resolved = tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;

    document.getElementById("totalTickets").innerText = total;
    document.getElementById("openTickets").innerText = open;
    document.getElementById("progressTickets").innerText = progress;
    document.getElementById("resolvedTickets").innerText = resolved;
}

function getPriorityBadgeClass(priority) {
    if (priority === "High") return "badge-prio-high";
    if (priority === "Medium") return "badge-prio-medium";
    return "badge-prio-low";
}

function getStatusBadgeClass(status) {
    if (status === "Open") return "badge-status-open";
    if (status === "In Progress") return "badge-status-progress";
    if (status === "Resolved") return "badge-status-resolved";
    return "badge-status-closed";
}

function populateTable(tickets) {
    const tableBody = document.getElementById("ticketTableBody");
    if (!tableBody) return;

    if (tickets.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i data-lucide="inbox" style="margin: 0 auto 10px; opacity: 0.5; display: block; width: 32px; height: 32px;"></i>
                    No support tickets found matching current filters.
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    let html = "";
    tickets.forEach(ticket => {
        const creatorCell = currentUser.role === "admin" 
            ? `<td><div style="font-weight: 500; font-size: 13px;">${ticket.created_by}</div></td>` 
            : "";
            
        let statusCell = "";
        if (currentUser.role === "admin") {
            // Render Status Selector for Admins
            statusCell = `
                <td>
                    <select class="status-select-admin" onchange="updateTicketStatus(${ticket.id}, this.value)">
                        <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="Closed" ${ticket.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </td>
            `;
        } else {
            // Render Status Badge for Customers
            statusCell = `
                <td>
                    <span class="badge-custom ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
                </td>
            `;
        }

        // Actions: Admins can delete. Customers can close their own if open.
        let actionButtons = "";
        if (currentUser.role === "admin") {
            actionButtons = `
                <button class="btn-custom btn-danger-custom btn-sm-custom" onclick="deleteTicket(${ticket.id})">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                </button>
            `;
        } else {
            if (ticket.status !== "Closed" && ticket.status !== "Resolved") {
                actionButtons = `
                    <button class="btn-custom btn-secondary-custom btn-sm-custom" onclick="closeTicket(${ticket.id})">
                        <i data-lucide="x" style="width: 14px; height: 14px;"></i> Close Ticket
                    </button>
                `;
            } else {
                actionButtons = `<span style="font-size: 12px; color: var(--text-muted);">None</span>`;
            }
        }

        html += `
            <tr>
                <td><span style="font-family: monospace; font-weight: 600; color: var(--text-muted);">#${ticket.id}</span></td>
                <td>
                    <div class="ticket-row-title">${escapeHTML(ticket.title)}</div>
                    <div class="ticket-row-desc">${escapeHTML(ticket.description)}</div>
                </td>
                ${creatorCell}
                <td>
                    <span class="badge-custom ${getPriorityBadgeClass(ticket.priority)}">${ticket.priority}</span>
                </td>
                ${statusCell}
                <td style="text-align: right;">
                    <div class="actions-cell" style="justify-content: flex-end;">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    lucide.createIcons();
}

function populateDashboardRecent(tickets) {
    const tableBody = document.getElementById("recentTicketTableBody");
    if (!tableBody) return;

    // Take top 5 recent tickets (highest ID first)
    const sorted = [...tickets].sort((a, b) => b.id - a.id).slice(0, 5);

    if (sorted.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No recent tickets.
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    sorted.forEach(ticket => {
        html += `
            <tr>
                <td>
                    <div class="ticket-row-title">${escapeHTML(ticket.title)}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">#${ticket.id} by ${ticket.created_by}</div>
                </td>
                <td>
                    <span class="badge-custom ${getPriorityBadgeClass(ticket.priority)}">${ticket.priority}</span>
                </td>
                <td>
                    <span class="badge-custom ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    lucide.createIcons();
}

// Update Ticket Status (Admin)
async function updateTicketStatus(ticketId, newStatus) {
    try {
        // Fetch current ticket details first to prevent losing title/description
        const getRes = await fetch(`${API}/tickets/${ticketId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!getRes.ok) {
            showToast("Failed to fetch current ticket specifications", "error");
            return;
        }

        const ticket = await getRes.json();

        // Update
        const putRes = await fetch(`${API}/tickets/${ticketId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: ticket.title,
                description: ticket.description,
                priority: ticket.priority,
                status: newStatus
            })
        });

        const data = await putRes.json();

        if (putRes.ok) {
            showToast(`Ticket #${ticketId} status updated to: ${newStatus}`, "success");
            loadTickets();
        } else {
            showToast(data.detail || "Failed to update status", "error");
            loadTickets(); // Refresh to reset visual dropdown state
        }
    } catch (e) {
        console.error(e);
        showToast("Error updating ticket status", "error");
    }
}

// Close Ticket (Customer)
async function closeTicket(ticketId) {
    try {
        // Fetch current ticket
        const getRes = await fetch(`${API}/tickets/${ticketId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!getRes.ok) {
            showToast("Failed to fetch ticket specs", "error");
            return;
        }

        const ticket = await getRes.json();

        // Send closed status
        const putRes = await fetch(`${API}/tickets/${ticketId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: ticket.title,
                description: ticket.description,
                priority: ticket.priority,
                status: "Closed"
            })
        });

        const data = await putRes.json();

        if (putRes.ok) {
            showToast("Ticket closed successfully", "success");
            loadTickets();
        } else {
            showToast(data.detail || "Failed to close ticket", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error closing ticket", "error");
    }
}

// Delete Ticket (Admin)
async function deleteTicket(ticketId) {
    if (!confirm(`Are you sure you want to permanently delete support ticket #${ticketId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API}/tickets/${ticketId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`Support ticket #${ticketId} deleted permanently`, "success");
            loadTickets();
        } else {
            showToast(data.detail || "Failed to delete ticket", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error deleting ticket records", "error");
    }
}

// Helper to escape HTML and prevent injection attacks
function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}