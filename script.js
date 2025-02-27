function updateDate() {
  const dateElement = document.querySelector('.date');
  const today = new Date();

  // Format options for the date
  const options = { year: 'numeric', month: 'long', day: 'numeric' };

  // Convert date to a readable format
  const formattedDate = today.toLocaleDateString('en-US', options);

  // Set the formatted date to the span
  dateElement.textContent = formattedDate;
}

// Call function to update date on page load
updateDate();

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