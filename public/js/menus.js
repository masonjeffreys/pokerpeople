function toggleProfileDropdown(){
    var dropdown = document.getElementById("profile-dropdown");
    if (dropdown.classList.contains('opacity-0')) {
      dropdown.classList.remove('opacity-0');
    } else {
      dropdown.classList.add('opacity-0');
    }
  }