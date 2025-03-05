// Add a Tenant -- Di ako sure.... Paano mag test
async function addTenant() {
  try {
      const tenantData = {
          firstName: document.getElementById('firstName').value,
          middleName: document.getElementById('middleName').value,
          lastName: document.getElementById('lastName').value,
          contact: document.getElementById('contactNumber').value,
          dateOfBirth: document.getElementById('dateOfBirth').value,
          sex: document.getElementById('sex').value,
          roomId: document.getElementById('roomAssignment').value
      };

      const response = await fetch('http://localhost:3000/tenants', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(tenantData)
      });

      const result = await response.json();
      
      if (response.ok) {
          alert('Tenant added successfully!');
          // Optional: Clear form or refresh tenant list
          fetchTenants();
      } else {
          throw new Error(result.error || 'Failed to add tenant');
      }
  } catch (error) {
      console.error("Error adding tenant:", error);
      alert(error.message);
  }
}
// End of Add a Tenant Function
async function removeTenant(tenantId) {
  try {
      const response = await fetch(`http://localhost:3000/tenants/${tenantId}`, {
          method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok) {
          alert('Tenant removed successfully!');
          fetchTenants();
      } else {
          throw new Error(result.error || 'Failed to remove tenant');
      }
  } catch (error) {
      console.error("Error removing tenant:", error);
      alert(error.message);
  }
}
// Remove a Tenant

// End of Remove a Tenant Function


// Edit Tenant Details

// End of Edit Tenant Details Function


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