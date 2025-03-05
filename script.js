// Modal Utility Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "block";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "none";
}


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
      const roomId = document.getElementById('roomId').value;
      
      // New address fields
      const street = document.getElementById('street').value;
      const barangay = document.getElementById('barangay').value;
      const city = document.getElementById('city').value;
      const region = document.getElementById('region').value;

      // Validate inputs
      if (!firstName || !lastName || !contact || !dob || !sex || !roomId ||
          !street || !barangay || !city || !region) {
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
              roomId,
              street,
              barangay,
              city,
              region
          })
      });

      if (!response.ok) {
          throw new Error('Failed to add tenant');
      }

      alert('Tenant added successfully!');
      
      // Close modal and reset form
      closeModal('addTenantModal');
      event.target.reset();
      
      // Refresh rooms to update the display
      fetchRooms();
  } catch (error) {
      console.error("Error adding tenant:", error);
      alert("Failed to add tenant. " + error.message);
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


// Setup Event Listeners -- para click sa modal, popup ang modal
document.addEventListener('DOMContentLoaded', () => {
  // Hide all modals when page loads
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });

  // Add Tenant Button
  const addTenantBtn = document.querySelector('.buttons button:nth-child(1)');
  addTenantBtn.addEventListener('click', () => openModal('addTenantModal'));

  // Remove Tenant Button
  const removeTenantBtn = document.querySelector('.buttons button:nth-child(2)');
  removeTenantBtn.addEventListener('click', () => openModal('removeTenantModal'));

  // Close Modal Buttons
  const closeButtons = document.querySelectorAll('.close-button');
  closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
          const modalId = e.target.closest('.modal').id;
          closeModal(modalId);
      });
  });

});

// Form Submissions
const addTenantForm = document.getElementById('addTenantForm');
addTenantForm.addEventListener('submit', addTenant);

const removeTenantForm = document.getElementById('removeTenantForm');
removeTenantForm.addEventListener('submit', removeTenant);



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


// Image Slider Section
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
// End of Image Slider Section