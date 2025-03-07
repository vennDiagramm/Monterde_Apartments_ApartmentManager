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
  updateRoomDropdown(getCurrentApartment()); // Fetch rooms dynamically
});

document.getElementById("roomsButton").addEventListener("click", function () {
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
            <td>${room.Room_Status_Desc}</td>
        `;
        tbody.appendChild(row);
    });
}

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
      const response = await fetch('http://localhost:3000/add-person', {
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
        const response = await fetch(`http://localhost:3000/remove-tenant/${personId}`, {
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


// Edit Tenant Details

// End of Edit Tenant Details Function

// Update Tenant Details
async function updateRoom(event) {
    event.preventDefault();
    // IF IN the rooms modal
    const roomsModal = document.getElementById('roomsModal');
    const selectedRoomId = roomsModal.querySelector('.roomId').value;
    const floor = document.getElementById("roomFloor").value;
    const tenants = document.getElementById("numTenants").value;
    const maxRenters = document.getElementById("maxRenters").value;
    const price = document.getElementById("roomPrice") ? document.getElementById("roomPrice").value : "0.00";
    const status = document.getElementById("roomStatus").value;

    console.log("Selected status:", status); // Debugging log

    // Ensure status is a number
    status = parseInt(status, 10);  
    
    // If any field is invalid, show a single error message
    if (!selectedRoomId) {
        alert("Room ID is required.");
    } 
    if (!floor || floor < 0) {
        alert("Floor must be a non-negative number.");
    } 
    if (!tenants || tenants < 0) {
        alert("Tenants must be a non-negative number.");
    } 
    if (!maxRenters || maxRenters < 1) {
        alert("Max renters must be at least 1.");
    } 
    if (!price || price < 0) {
        alert("Price must be a non-negative number.");
    } 
    if (!status) {
        alert("Status is required.");
    }
    
    if(status === "Vacant"){
        status = 1;
    } else if(status === "Occupied"){
        status = 2;
    } else if(status === "Maintenance"){
        status = 3;
    } else if(status === "Reserved"){
        status = 4;
    } else if(status === "Unavailable"){
        status = 5;
    }

    // Gather validated values
    const updatedRoom = {
        floor,
        tenants,
        max_renters: maxRenters,
        price,
        status,
        room_id: selectedRoomId
    };

    try {
        const response = await fetch("http://localhost:3000/updateRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRoom)
        });

        if (response.ok) {
            alert("Room updated successfully!");
            //closeModal('roomsModal');
            //event.target.reset();
        } else {
            alert("Failed to update room.");
        }
        
        
        
        // Refresh rooms to update the display
        fetchRooms();
    } catch (error) {
        console.error("Error updating room:", error);
    }
}
// End of Update Tenant Details Function

// Setup Event Listeners -- para click sa modal, popup ang modal
document.addEventListener('DOMContentLoaded', () => {
    // Hide all modals when page loads
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none');
  
    // Modal Buttons
    const modalButtons = {
        addTenant: document.querySelector('.buttons button:nth-child(1)'),
        removeTenant: document.querySelector('.buttons button:nth-child(2)'),
        rooms: document.querySelector('.buttons button:nth-child(4)')
    };
  
    // Event Listeners for Opening Modals
    modalButtons.addTenant.addEventListener('click', () => openModal('addTenantModal'));
    modalButtons.removeTenant.addEventListener('click', () => openModal('removeTenantModal'));
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

const updateRoomForm = document.getElementById('updateRoomForm');
updateRoomForm.addEventListener('submit', updateRoom);
// End of Form Submissions


// Check Rooms
async function fetchRooms() {
  try {
      const response = await fetch('http://localhost:3000/rooms');
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

fetchRooms();
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

updateDate();
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

