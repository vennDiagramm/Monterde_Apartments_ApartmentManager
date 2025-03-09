fetchRooms(); // Fetch rooms on page load
updateDate(); // Update the date on page load

// Modal Utility Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "block";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "none";
}

// Get rooms by aptLocId
function getCurrentApartment() {
    const apartmentNames = ["Sesame Apartment", "Matina Apartment", "Nabua Apartment"];
    const slides = document.querySelectorAll(".mySlides");
    let currentApartment = "";
    slides.forEach((slide, index) => {
        if (slide.style.display === "block") {
            currentApartment = apartmentNames[index];
        }
    });
    console.log("Current apartment:", currentApartment); // Debugging log
    return currentApartment;
}
// End of Function to get the active apartment name


/**  ----------------------     ROOMS SECTIONS    ----------------------     **/

// Update room dropdown based on selected apartment
function updateRoomDropdown(apartment) {
    const roomDropdowns = document.querySelectorAll(".roomId"); // Select multiple elements
    if (roomDropdowns.length === 0) return;

    roomDropdowns.forEach(dropdown => {
        dropdown.innerHTML = ""; // Clear existing options

        // Map apartments to their Apt_Loc_ID
        const apartmentMap = {
            "Matina Apartment": 1,
            "Sesame Apartment": 2,
            "Nabua Apartment": 3
        };

        const aptLocId = apartmentMap[apartment];
        if (!aptLocId) return;

        // Fetch available rooms from the database
        fetch(`/getRooms/${aptLocId}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    let option = document.createElement("option");
                    option.textContent = "No available rooms";
                    dropdown.appendChild(option);
                } else {
                    data.forEach(room => {
                        let option = document.createElement("option");
                        option.value = room.Room_ID;
                        option.textContent = `Room ${room.Room_ID}`;
                        dropdown.appendChild(option);
                    });
                }
            })
            .catch(error => console.error("Error fetching rooms:", error));
    });
}
// End of Update room dropdown based on selected apartment

// Show by rooms
document.addEventListener("DOMContentLoaded", function () {
  const apartmentNames = ["Sesame Apartment", "Matina Apartment", "Nabua Apartment"];

  // Get the current apartment name
  function getCurrentApartment() {
      const slides = document.querySelectorAll(".mySlides");
      let currentApartment = "";
      slides.forEach((slide, index) => {
          if (slide.style.display === "block") {
              currentApartment = apartmentNames[index];
          }
      });
      return currentApartment;
  }

  // Event Listeners
  document.querySelector(".next").addEventListener("click", () => {
      setTimeout(() => {
          updateRoomDropdown(getCurrentApartment());
      }, 300);
  });

  document.querySelector(".prev").addEventListener("click", () => {
      setTimeout(() => {
          updateRoomDropdown(getCurrentApartment());
      }, 300);
  });

  updateRoomDropdown(getCurrentApartment()); // Initialize on load
});
// End of Show by rooms Function


// Update Rooms available in the dropdown
document.getElementById("addTenantButton").addEventListener("click", function () {
    fetchRooms(); 
  updateRoomDropdown(getCurrentApartment()); // Fetch rooms dynamically
});

document.getElementById("roomsButton").addEventListener("click", function () {
    fetchRooms();
    updateRoomDropdown(getCurrentApartment()); // Fetch rooms dynamically
  });
// End of Update  Rooms available in the dropdown



// Populate the room table with room details
async function populateRoomTable(rooms) {
    const tbody = document.getElementById('roomTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data
    rooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${room.Room_ID}</td>
            <td>${room.Room_floor}</td>
            <td>${room.Number_of_Renters}</td>
            <td>${room.Room_maxRenters}</td>
            <td>₱${room.Room_Price.toLocaleString()}</td>
            <td>${room.Room_Status_Desc}</td>
        `;
        tbody.appendChild(row);
    });
}

// Fetch rooms based on the current apartment
document.getElementById("roomsButton").addEventListener("click", async function () {
    const apartment = getCurrentApartment();
    const apartmentMap = {
        "Matina Apartment": 1,
        "Sesame Apartment": 2,
        "Nabua Apartment": 3
    };
    const aptLocId = apartmentMap[apartment];
    const response = await fetch(`/getFullRoomView/${aptLocId}`);
    const rooms = await response.json();
    populateRoomTable(rooms);
});
// End of fetch rooms based on the current apartment

/**     MORE OPTIONS FOR ROOM SECTION       **/

// More OPTIONS for ROOMS
document.getElementById("moreOptionsBtn").addEventListener("click", function(event) {
    event.preventDefault(); // Prevent accidental form submission
    const options = document.getElementById("moreOptions");
    options.style.display = options.style.display === "none" ? "block" : "none";
});


document.addEventListener("DOMContentLoaded", function () {
    setupModals();
    setupRoomActions();
});

// Handle opening and closing modals
function setupModals() {
    const modals = {
        addRoom: document.getElementById("addRoomModal"),
        deleteRoom: document.getElementById("deleteRoomModal"),
        viewRooms: document.getElementById("viewRoomsModal"),
    };

    const buttons = {
        addRoom: document.getElementById("addRoom"),
        deleteRoom: document.getElementById("deleteRoom"),
        viewRooms: document.getElementById("viewRooms"),
    };

    // Close buttons
    document.querySelectorAll(".close-button").forEach(button => {
        button.addEventListener("click", () => {
            Object.values(modals).forEach(modal => modal.style.display = "none");
        });
    });

    // Open modal events
    buttons.addRoom.addEventListener("click", () => modals.addRoom.style.display = "flex");
    buttons.deleteRoom.addEventListener("click", () => modals.deleteRoom.style.display = "flex");
    buttons.viewRooms.addEventListener("click", () => {
        fetchRooms();
        modals.viewRooms.style.display = "flex";
    });
}

// Get room data from the Add Room form
function getRoomFormData() {
    const floor = document.getElementById("roomFloorAdd").value;
    const maxRenters = document.getElementById("maxRentersAdd").value;
    const price = document.getElementById("roomPriceAdd").value;
    const status = document.getElementById("roomStatusAdd").value;

    if (floor === "" || maxRenters === "" || price === "" || status === "") {
        alert("Please fill in all fields!");
        return null;  // Prevent sending empty values
    }

    return { floor, maxRenters, price, status };
}

// Add Room
async function addRoom(event) {
    event.preventDefault();
    // const roomsModal = document.getElementById('addRoomModal');
    const floor = parseInt(document.getElementById("roomFloorAdd").value, 10);
    const maxRenters = parseInt(document.getElementById("maxRentersAdd").value, 10);
    const price = parseFloat(document.getElementById("roomPriceAdd").value);
    const status = parseInt(document.getElementById("roomStatusAdd").value, 10);
    let number_of_Renters = 0;
    
    // Get the apartment name
    const apartmentName = getCurrentApartment();
    
    // Map apartments to their Apt_Loc_ID
    const apartmentMap = {
        "Matina Apartment": 1,
        "Sesame Apartment": 2,
        "Nabua Apartment": 3
    };
    
    // Get the ID from the map
    const apt_loc = apartmentMap[apartmentName];
    
    // Validate apartment ID
    if (!apt_loc) {
        alert("Invalid apartment location.");
        return;
    }
    
    // Validate input fields
    if (isNaN(floor) || floor < 0) {
        alert("Floor must be a non-negative number.");
        return;
    }
    if (isNaN(maxRenters) || maxRenters < 1) {
        alert("Max renters must be at least 1.");
        return;
    }
    if (isNaN(price) || price < 0) {
        alert("Price must be a non-negative number.");
        return;
    }
    if (isNaN(status)) {
        alert("Status is required.");
        return;
    }
    
    // Prepare request payload with correct parameter names
    const newRoom = { 
        floor, 
        tenants: number_of_Renters, 
        max_renters: maxRenters, 
        status, 
        price, 
        apt_loc
    };
    
    try {
        const response = await fetch("/addRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRoom)
        });

        if (response.ok) {
            alert("Room added successfully!");
            closeModal('addRoomModal');
            event.target.reset();
        } else {
            alert("Failed to add room.");
        }
        
        fetchRooms(); // Refresh rooms to update the display
    } catch (error) {
        console.error("Error adding room:", error);
    }
}
// End of Add Room Function

// Delete Room
async function deleteRoom(roomId) {
    if (!roomId) {
        alert("Please enter a valid Room ID!");
        return;
    }

    // Confirm deletion
    const confirmDeletion = confirm("Are you sure you want to delete this room?");
    if (!confirmDeletion) {
        return;
    }

    try {
        const response = await fetch(`/deleteRoom/${roomId}`, { method: "DELETE" });

        if (!response.ok) {
            const errorData = await response.json(); // Parse JSON error response
            alert(errorData.error); // Show user-friendly message
            return false; // Prevent further execution
        }

        alert(`Room ${roomId} deleted successfully!`);

        // Close modal and refresh room list
        document.getElementById("deleteRoomModal").style.display = "none";
        fetchRooms();

        return true;
    } catch (error) {
        console.error("Error deleting room:", error);
        alert("An unexpected error occurred while deleting the room.");
        return false;
    }
}
// End of Delete Room Function

// View All Rooms
async function viewAllRooms(rooms) {
    const tbody = document.getElementById('allRoomsTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data
    rooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${room.Room_ID}</td>
            <td>${room.Room_floor}</td>
            <td>${room.Number_of_Renters}</td>
            <td>${room.Room_maxRenters}</td>
            <td>₱${room.Room_Price.toLocaleString()}</td>
            <td>${room.Room_Status_Desc}</td>
            <td>${room.Apt_Location}</td>
        `;
        tbody.appendChild(row);
    });
}
// End of View All Rooms Function

// Fetch rooms based on the current apartment.
document.getElementById("viewRooms").addEventListener("click", async function () {
    fetchRooms();
    const response = await fetch(`/viewAll`);
    const rooms = await response.json();
    viewAllRooms(rooms);

    // Only open the 'viewRoomsModal'
    const viewRoomsModal = document.getElementById("viewRoomsModal");
    viewRoomsModal.style.display = "block";
});

// Close ONLY the viewRoomsModal
document.querySelector("#viewRoomsModal .close-button").addEventListener("click", function () {
    document.getElementById("viewRoomsModal").style.display = "none";
});

// Close modal if clicking outside of it (but only for viewRoomsModal)
window.addEventListener("click", function (event) {
    const viewRoomsModal = document.getElementById("viewRoomsModal");
    if (event.target === viewRoomsModal) {
        viewRoomsModal.style.display = "none";
    }
});
// End of View All Rooms Function
/**     END OF MORE OPTIONS FOR ROOM SECTION       **/

/**  ----------------------     END OF ROOMS SECTION    ----------------------     **/


/**  ----------------------     TENANTS SECTIONS    ----------------------     **/
// Add a Tenant
async function addTenant(event) {
  event.preventDefault();
  try {
      // Gather form data
      const firstName = document.getElementById('firstName').value;
      const middleName = document.getElementById('middleName').value;
      const lastName = document.getElementById('lastName').value;
      const contact = document.getElementById('contact').value;
      const dob = document.getElementById('dob').value;
      const sex = document.getElementById('sex').value;

      // City and Address fields
      const city = document.getElementById('city').value;
      const region = document.getElementById('region').value;
      const barangay = document.getElementById('barangay').value;
      const street = document.getElementById('street').value;

      // Get the active apartment location
      let apartmentLocation = getCurrentApartment();

      // Room ID (sen) || IN THE add tenant modal
    const addTenantModal = document.getElementById('addTenantModal');
    const roomId = addTenantModal.querySelector('.roomId').value;


      // Validate inputs
      if (!firstName || !lastName || !contact || !dob || !sex || 
          !city || !region || !barangay || !street || !roomId || !apartmentLocation) {
          alert("Please fill in all required fields!");
          return;
      }

      // Send data to server
      const response = await fetch('/add-person', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              firstName,
              middleName,
              lastName,
              contact,
              dob,
              sex,
              city,
              region,
              barangay,
              street,
              apartmentLocation, // Include apartment location
              roomId
          })
      });

      if (!response.ok) {
          throw new Error('Failed to add tenant');
      }

      alert('Tenant and occupant added successfully!');
      
      // Close modal and reset form
      closeModal('addTenantModal');
      event.target.reset();

  } catch (error) {
      console.error("Error adding tenant:", error);
      alert("Failed to complete tenant registration. " + error.message);
  }
}
// End of Add a Tenant Function


// Remove a Tenant
async function removeTenant(event) {
    event.preventDefault();
    try {
        const personId = document.getElementById('personId').value;
        
        if (!personId) {
            alert("Please enter a valid Person ID!");
            return;
        }
  
        // Confirm removal
        const confirmRemoval = confirm("Are you sure you want to remove this tenant?");
        if (!confirmRemoval) {
            return;
        }
  
        // Send remove request to backend
        const response = await fetch(`/remove-tenant/${personId}`, {
            method: 'DELETE'
        });
  
        if (!response.ok) {
            throw new Error('Failed to remove tenant');
        }
  
        alert('Tenant removed successfully!');
        
        // Close modal and reset form
        closeModal('removeTenantModal');
        event.target.reset();
        
        // Refresh rooms to update the display
        fetchRooms();
    } catch (error) {
        console.error("Error removing tenant:", error);
        alert("Failed to remove tenant. " + error.message);
    }
  }
  // End of Remove a Tenant Function

// Show name for Edit Tenant
async function fetchTenantName(personId) {
    const nameField = document.getElementById("nameId");

    console.log(`THE PERSON ID: ${personId}`);
    if (!personId) {
        nameField.value = ""; // Clear name field if input is empty
        return;
    }

    try {
        const response = await fetch(`/get-person-name/${personId}`);
        const data = await response.json();

        if (response.ok && data.name) {
            nameField.value = data.name; // Display the name
        } else {
            nameField.value = "Not Found"; // Show error if no name exists
        }
    } catch (error) {
        console.error("Error fetching tenant name:", error);
        nameField.value = "Error fetching name";
    }
}

// Event listener for input change
document.getElementById("personIdEdit").addEventListener("change", async function() {
    await fetchTenantName(this.value);
});
// End of Show name for Edit Tenant Function

// Edit Tenant Details
async function editTenant(event) {
    event.preventDefault();

    const personId = document.getElementById("personIdEdit").value;
    const contact = document.getElementById("contactId").value;
    const moveInDate = document.getElementById("moveInDateId").value;
    const moveOutDate = document.getElementById("moveOutDateId").value;

    if (!personId || isNaN(personId) || !contact || isNaN(contact) || !moveInDate || !moveOutDate) {
        alert("All fields are required.");
        return;
    }

    console.log(`The person id: ${personId}`);
    console.log(contact);
    console.log(moveInDate);
    console.log(moveOutDate);
    
    if (!/^\d{11}$/.test(contact)) {
        alert("Contact number must be exactly 11 digits.");
        return;
    }

    const moveIn = new Date(moveInDate);
    const moveOut = new Date(moveOutDate);
    const today = new Date();

    if (moveIn >= moveOut) {
        alert("Move-out date must be after the move-in date.");
        return;
    }

    if (moveOut <= moveIn) {
        alert("Move-In date must be before the move-out date.");
        return;
    }

    try { 
        const response = await fetch(`/edit-tenant/${personId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contact, moveInDate, moveOutDate })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Tenant updated successfully.");
            document.getElementById("editTenantForm").reset();
            closeModal("editTenantModal"); // Close modal after updating
        } else {
            alert(`Error: ${result.error || "Unknown error occurred."}`);
        }
    } catch (error) {
        console.error("Failed to update tenant:", error);
        alert("Failed to connect to the server. Please try again.");
    }
}
// End of Edit Tenant Details Function


// Search button testing
document.getElementById('searchButton').addEventListener('click', async () => {
    const name = document.getElementById('nameSearch').value.trim();
    
    if (!name) {
        alert("Please enter a tenant's first name!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/search-tenant/${name}`);
        const data = await response.json();

        if (response.status === 404) {
            document.getElementById('searchResults').innerHTML = `<p>No tenant found.</p>`;
        } else {
            let resultHTML = `<ul>`;
            data.forEach(tenant => {
                resultHTML += `<li><strong>${tenant.FullName}</strong> - ${tenant.Person_Contact} - ${tenant.Person_sex ? "Male" : "Female"}</li>`;
            });
            resultHTML += `</ul>`;
            document.getElementById('searchResults').innerHTML = resultHTML;
        }

        document.getElementById('searchTenantModal').style.display = 'block';

    } catch (error) {
        console.error("Error searching tenant:", error);
        alert("Failed to search tenant.");
    }
});

// Close modal logic
document.querySelector('.close-button').addEventListener('click', () => {
    document.getElementById('searchTenantModal').style.display = 'none';
});

// End of Search button testing

// Update Room Details
async function updateRoom(event) {
    event.preventDefault();
    // IF IN the rooms modal
    const roomsModal = document.getElementById('roomsModal');
    const selectedRoomId = roomsModal.querySelector('.roomId').value;
    const floor = parseInt(document.getElementById("roomFloor").value, 10);
    const tenants = parseInt(document.getElementById("numTenants").value, 10);
    const maxRenters = parseInt(document.getElementById("maxRenters").value, 10);
    const price = parseFloat(document.getElementById("roomPrice") ? document.getElementById("roomPrice").value : "0.00");
    const status = parseInt(document.getElementById("roomStatus").value, 10);

    console.log("Selected status:", status); // Debugging log

    // If any field is invalid, show a single error message
    if (!selectedRoomId) {
        alert("Room ID is required.");
        return;
    }
    if (isNaN(floor) || floor < 0) {
        alert("Floor must be a non-negative number.");
        return;
    }
    if (isNaN(tenants) || tenants < 0) {
        alert("Tenants must be a non-negative number.");
        return;
    }
    if (isNaN(maxRenters) || maxRenters < 1) {
        alert("Max renters must be at least 1.");
        return;
    }
    if (isNaN(price) || price < 0) {
        alert("Price must be a non-negative number.");
        return;
    }
    if (isNaN(status)) {
        alert("Status is required.");
        return;
    }

    // Gather validated values
    const updatedRoom = {
        floor,
        tenants,
        max_renters: maxRenters,
        status,
        price,
        room_id: selectedRoomId
    };

    try {
        const response = await fetch("/updateRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRoom)
        });

        if (response.ok) {
            alert("Room updated successfully!");
            closeModal('roomsModal');
            event.target.reset();
        } else {
            alert("Failed to update room.");
        }

        // Refresh rooms to update the display
        fetchRooms();
    } catch (error) {
        console.error("Error updating room:", error);
    }
}
// End of Update Room Details Function

/// Payment Function
let rentPrice = 0; //global variable for payment
// Retrieve Rent Price
async function getRentPrice(event) {
  try {
      const personId = document.getElementById("personId").value;
      const roomId = document.getElementById("roomId").value;

      const response = await fetch(`http://localhost:3000/get-rent-price?personId=${personId}&roomId=${roomId}`);
      if (!response.ok) throw new Error("Failed to fetch room price");

      // Retrieve data and store rent price
      const data = await response.json();
      rentPrice = parseFloat(data.rent_price).toFixed(2);

      // Display rent price in payment modal
      document.getElementById("rentPrice").innerHTML = rentPrice.toFixed(2); 

  } catch (error) {
      console.error(error);
      alert("Error fetching rent price: " + error.message);
  }
}

// Payment Process
async function paymentProcess(event) {
    try {
      const payment = parseFloat(document.getElementById("payment").value);
      const remarks = document.getElementById("remarks").value
      
      //Checks if valid
      if (!payment || payment < rentPrice) {
        alert("Enter a valid amount greater than or equal to the rent price.");
        return;
      }
  
      //Payment change calculation
      const change = payment - rentPrice;
      alert(`Payment successful! Change: ${change.toFixed(2)}`);
  
      // Send payment data to the server
      const response = await fetch("/payment-process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: document.getElementById("personId").value,
          roomId: document.getElementById("roomId").value,
          amountPaid: payment,
          change: change,
          date: new Date().toISOString().split("T")[0],
          remarks: remarks,
        }),
      });
  
      //Displays the change 
      document.getElementById("change").innerText = `Change: ₱${change.toFixed(2)}`;
      
      if (!response.ok) throw new Error("Failed to process payment");
      alert("Payment recorded successfully!");
  
    } catch (error) {
      console.error(error);
      alert("Error processing payment.");
    }
  }
  
//Extra function for payment section
const confirmButton = document.getElementById("confirmButton");
confirmButton.addEventListener("click", async () => {
    await getRentPrice(); // Fetch rent price
    
    if (rentPrice > 0) {
        document.getElementById("rentSection").style.display = "block"; // Show payment section
      } else {
        document.getElementById("rentSection").style.display = "none"; // Hide payment section
      }
});

  // End of Payment Function

// Setup Event Listeners -- para click sa modal, popup ang modal
document.addEventListener('DOMContentLoaded', () => {
    // Hide all modals when page loads
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
  
    // Modal Buttons
    const modalButtons = {
        addTenant: document.querySelector('.buttons button:nth-child(1)'),
        removeTenant: document.querySelector('.buttons button:nth-child(2)'),
        editTenant: document.querySelector('.buttons button:nth-child(3)'),
        rooms: document.querySelector('.buttons button:nth-child(4)'),
        payment: document.querySelector('.buttons button:nth-child(5)')
    };
  
    // Event Listeners for Opening Modals
    modalButtons.addTenant.addEventListener('click', () => openModal('addTenantModal'));
    modalButtons.removeTenant.addEventListener('click', () => openModal('removeTenantModal'));
    modalButtons.editTenant.addEventListener('click', () => openModal('editTenantModal'));
    modalButtons.payment.addEventListener('click', () => openModal('paymentModal'));
    modalButtons.rooms.addEventListener('click', () => {
        openModal('roomsModal');
          
         // Prevent invalid inputs
        const numericInputs = ["roomFloor", "numTenants", "maxRenters"];
        const priceInput = document.getElementById("roomPrice");

        // Prevent negative values for all number fields
        numericInputs.forEach(id => {
            const inputField = document.getElementById(id);
            if (inputField) {
                inputField.addEventListener("input", function () {
                    if (this.value < 0) this.value = 0; // Ensure no negative values
                });
            }
        });  

        // Ensure room price input allows only two decimal places & no negatives
        if (priceInput) {
            priceInput.addEventListener("input", function () {
                if (this.value < 0) {
                    this.value = "0.00";
                } else {
                    // Limit to two decimal places
                    this.value = parseFloat(this.value).toFixed(2);
                }
            });
        }
    });
  
    // Close Modal Buttons
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.closest('.modal').id;
            closeModal(modalId);
        });
    });
  });
  // End of Setup Event Listeners

// Form Submissions
const addTenantForm = document.getElementById('addTenantForm');
addTenantForm.addEventListener('submit', addTenant);

const removeTenantForm = document.getElementById('removeTenantForm');
removeTenantForm.addEventListener('submit', removeTenant);

const editTenantForm = document.getElementById('editTenantForm');
if (editTenantForm) {
    editTenantForm.addEventListener('submit', editTenant);
}

const updateRoomForm = document.getElementById('updateRoomForm');
updateRoomForm.addEventListener('submit', updateRoom);

const addRoomForm = document.getElementById('addRoomForm');
addRoomForm.addEventListener('submit', addRoom);

const deleteRoomForm = document.getElementById('deleteRoomForm');
deleteRoomForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const roomId = document.getElementById("roomIdDelete").value;
    const success = await deleteRoom(roomId);
    
    if (success) {
        // Only reset if deletion was successful
        this.reset();
    }
});

const paymentForm = document.getElementById('paymentForm');
paymentForm.addEventListener('submit', paymentProcess);
// End of Form Submissions


// Check Rooms
async function fetchRooms() {
  try {
      const response = await fetch('/rooms');
      const rooms = await response.json();

      // Make sure at least one room exists
      if (rooms.length > 0) {
          document.getElementsByClassName('requests-bar')[0].value = 
              `Room ${rooms[0].Room_ID} - ₱${rooms[0].Room_Price.toLocaleString()}`;
      }
  } catch (error) {
      console.error("Error fetching rooms:", error);
  }
}
// End of Check Rooms Function


// Calculate Rent

// End of Calculate Rent Function


// Update the Date daily
function updateDate() {
  const dateElement = document.querySelector('.date');
  const today = new Date();

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);

  dateElement.textContent = formattedDate;
}
// End of Date Function


/**  ----------------------     IMAGE SLIDERS SECTIONS    ----------------------     **/
let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}
/**  ----------------------     END OF IMAGE SLIDERS    ----------------------     **/

