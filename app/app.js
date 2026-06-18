const API_URL = "https://support-ticket-system-0jle.onrender.com";;

function showSection(id){

    document
        .querySelectorAll(".section")
        .forEach(section=>{
            section.classList.remove("active");
        });

    document
        .getElementById(id)
        .classList.add("active");
}

async function registerUser(){

    const response = await fetch(`${API}/register`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            name:rname.value,
            email:remail.value,
            password:rpassword.value

        })
    });

    const data = await response.json();

    alert(JSON.stringify(data));
}

async function loginUser(){

    alert("Connect Login API Here");
}

async function createTicket(){

    const response = await fetch(`${API}/tickets`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            title:title.value,
            description:description.value,
            priority:priority.value

        })
    });

    const data = await response.json();

    alert(data.message);

    loadTickets();
}

async function loadTickets(){

    const response = await fetch(`${API}/tickets`);

    const tickets = await response.json();

    document.getElementById("totalTickets").innerText =
        tickets.length;

    let html="";

    tickets.forEach(ticket=>{

        html += `
        <tr>

            <td>${ticket.id}</td>

            <td>${ticket.title}</td>

            <td>${ticket.priority}</td>

            <td>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteTicket(${ticket.id})">

                    Delete

                </button>

            </td>

        </tr>
        `;
    });

    document.getElementById("ticketTable").innerHTML =
        html;
}

async function deleteTicket(id){

    await fetch(`${API}/tickets/${id}`,{
        method:"DELETE"
    });

    loadTickets();
}

showSection("dashboard");

loadTickets();