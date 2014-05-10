(function() {

  $(function() {
    $('.tooltip-examples a, .tooltip-paragraph-examples a').tooltip({
      animation: false
    });


    return $('a[data-toggle="testimonial"]').on("click", function(e) {
      $(this).closest('.testimonials-users').find('a[data-toggle="testimonial"]').removeClass("active");
      $(this).addClass("active");
      $('.testimonials-speech').removeClass('active');
      $('.testimonials-speech' + $(this).attr('href')).addClass('active');
      return false;
    });
  });
  $("body").on("touchstart.dropdown", ".dropdown-menu", function(e) {
    return e.stopPropagation();
  });
  return $(document).on("click", ".dropdown-menu a", function() {
    return document.location = $(this).attr("href");
  });
}).call(this);
