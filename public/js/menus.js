function toggleProfileDropdown(){
    var dropdown = document.getElementById("profile-dropdown");
    if (dropdown.classList.contains('opacity-0')) {
      dropdown.classList.remove('opacity-0');
    } else {
      dropdown.classList.add('opacity-0');
    }
  }

function toggleMobileMenu(){
  var mobileHamburger = document.getElementById("mobileHamburger");
  var mobileX = document.getElementById("mobileX");
  let mobileMenu = document.getElementById("mobile-menu");
    if (mobileHamburger.classList.contains('hidden')) {
      // Menu currently showing. We need to switch it off and turn the menu button on.
      mobileHamburger.classList.remove('hidden');
      mobileHamburger.classList.add('block');
      mobileX.classList.add('hidden');
      mobileMenu.classList.add('hidden');
    } else {
      // Menu currently hidden. We need to switch it on and turn the menu button to an 'X'
      mobileHamburger.classList.add('hidden');
      mobileX.classList.remove('hidden');
      mobileX.classList.add('block');
      mobileMenu.classList.remove('hidden');
    }
}