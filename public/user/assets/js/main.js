(function($){
	"use strict";
    
    // Search Popup JS
    $(".others-option .search-btn").on("click", function(){
        $(".search-overlay").toggleClass("search-overlay-active");
    });
    $(".search-overlay-close").on("click", function(){
        $(".search-overlay").removeClass("search-overlay-active");
    });
    $(".header-top-others-option .search-btn").on("click", function(){
        $(".search-overlay").toggleClass("search-overlay-active");
    });
    
    // Mean Menu
    $('.mean-menu').meanmenu({
        meanScreenWidth: "991"
    });

    // Header Sticky
    $(window).on('scroll',function() {
        if ($(this).scrollTop() > 130){  
            $('.header-sticky').addClass("is-sticky");
        }
        else{
            $('.header-sticky').removeClass("is-sticky");
        }
    });
    var c, currentScrollTop = 0,
    navbar = $('.header-sticky');
    $(window).scroll(function () {
        var a = $(window).scrollTop();
        var b = navbar.height();
        currentScrollTop = a;
        if (c < currentScrollTop && a > b + b) {
            navbar.addClass("scrollUp");
        } else if (c > currentScrollTop && !(a <= b)) {
            navbar.removeClass("scrollUp");
        }
        c = currentScrollTop;
    });

    // Home Slides
    $('.home-slides').owlCarousel({
        loop: true,
        nav: true,
        dots: true,
        autoplayHoverPause: true,
        autoplay: true,
        smartSpeed: 500,
        autoHeight: true,
        items: 1,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
    });
    $(".home-slides").on("translate.owl.carousel", function(){
        $(".main-banner-content .sub-title").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".main-banner-content h1").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".main-banner-content p").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".main-banner-content .btn-box").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
    });
    $(".home-slides").on("translated.owl.carousel", function(){
        $(".main-banner-content .sub-title").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".main-banner-content h1").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".main-banner-content p").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".main-banner-content .btn-box").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
    });
    
    // Home Slides Two
    $('.home-slides-two').owlCarousel({
        loop: true,
        nav: true,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        autoHeight: true,
        animateOut: 'animate__animated animate__slideOutUp',
        items: 1,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
    });

    // Home Slides Three
    $('.home-slides-three').owlCarousel({
        loop: true,
        nav: false,
        dots: true,
        autoplayHoverPause: true,
        items: 1,
        smartSpeed: 750,
        autoplay: true,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
    });
    $(".home-slides-three").on("translate.owl.carousel", function(){
        $(".main-banner-content .sub-title").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".main-banner-content h1").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".main-banner-content p").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".main-banner-content .btn-box").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".banner-image img").removeClass("animate__animated animate__fadeInUp").css("opacity", "0");
        $(".banner-image .circle").removeClass("animate__animated animate__zoomIn").css("opacity", "0");
    });
    $(".home-slides-three").on("translated.owl.carousel", function(){
        $(".main-banner-content .sub-title").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".main-banner-content h1").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".main-banner-content p").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".main-banner-content .btn-box").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".banner-image img").addClass("animate__animated animate__fadeInUp").css("opacity", "1");
        $(".banner-image .circle").addClass("animate__animated animate__zoomIn").css("opacity", "1");
    });
    
    // Tooltip JS
    $(function () {
        $('[data-bs-toggle="tooltip"]').tooltip();
    });

    // Facility Slides
    $('.facility-slides').owlCarousel({
        loop: true,
        nav: true,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        margin: 30,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 1,
            },
            576: {
                items: 2,
            },
            768: {
                items: 3,
            },
            1200: {
                items: 4,
            }
        }
    });
    
    // Products Slides
    $('.products-slides').owlCarousel({
        loop: true,
        nav: true,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        margin: 30,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 1,
            },
            576: {
                items: 2,
            },
            768: {
                items: 2,
            },
            1200: {
                items: 3,
            }
        }
    });

    // Instagram Slides
    $('.instagram-slides').owlCarousel({
        loop: true,
        nav: false,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 1,
            },
            576: {
                items: 2,
            },
            768: {
                items: 3,
            },
            1200: {
                items: 6,
            }
        }
    });
    
    // Partner Slides
    $('.partner-slides').owlCarousel({
        loop: true,
        nav: false,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 2,
            },
            576: {
                items: 4,
            },
            768: {
                items: 4,
            },
            1200: {
                items: 7,
            }
        }
    });

    // Offer Products Slides
    $('.offer-products-slides').owlCarousel({
        loop: true,
        nav: false,
        dots: true,
        autoplayHoverPause: true,
        autoplay: true,
        animateOut: 'fadeOut',
        mouseDrag: false,
        items: 1,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
    });

    // Brand Slides
    $('.brand-slides').owlCarousel({
        loop: true,
        nav: false,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 2,
            },
            576: {
                items: 3,
            },
            768: {
                items: 4,
            },
            1200: {
                items: 7,
            }
        }
    });

    // Price Range Slider JS
    $(".js-range-of-price").ionRangeSlider({
        type: "double",
        drag_interval: true,
        min_interval: null,
        max_interval: null,
    });

    // Input Plus & Minus Number JS
    $('.input-counter').each(function() {
        var spinner = jQuery(this),
        input = spinner.find('input[type="text"]'),
        btnUp = spinner.find('.plus-btn'),
        btnDown = spinner.find('.minus-btn'),
        min = input.attr('min'),
        max = input.attr('max');
        
        btnUp.on('click', function() {
            var oldValue = parseFloat(input.val());
            if (oldValue >= max) {
                var newVal = oldValue;
            } else {
                var newVal = oldValue + 1;
            }
            spinner.find("input").val(newVal);
            spinner.find("input").trigger("change");
        });
        btnDown.on('click', function() {
            var oldValue = parseFloat(input.val());
            if (oldValue <= min) {
                var newVal = oldValue;
            } else {
                var newVal = oldValue - 1;
            }
            spinner.find("input").val(newVal);
            spinner.find("input").trigger("change");
        });
    });

    // Testimonials Slides
    $('.testimonials-slides').owlCarousel({
        loop: true,
        nav: false,
        dots: true,
        margin: 30,
        autoplayHoverPause: true,
        autoplay: true,
        center: true,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 1,
            },
            576: {
                items: 2,
            },
            768: {
                items: 2,
            },
            1200: {
                items: 3,
            }
        }
    });

    // Tabs
    (function ($) {
        $('.tab ul.tabs').addClass('active').find('> li:eq(0)').addClass('current');
        $('.tab ul.tabs li a').on('click', function (g) {
            var tab = $(this).closest('.tab'), 
            index = $(this).closest('li').index();
            tab.find('ul.tabs > li').removeClass('current');
            $(this).closest('li').addClass('current');
            tab.find('.tab-content').find('div.tabs-item').not('div.tabs-item:eq(' + index + ')').slideUp();
            tab.find('.tab-content').find('div.tabs-item:eq(' + index + ')').slideDown();
            g.preventDefault();
        });
    })(jQuery);

    // FAQ Accordion
    $(function() {
        $('.accordion').find('.accordion-title').on('click', function(){
            // Adds Active Class
            $(this).toggleClass('active');
            // Expand or Collapse This Panel
            $(this).next().slideToggle('fast');
            // Hide The Other Panels
            $('.accordion-content').not($(this).next()).slideUp('fast');
            // Removes Active Class From Other Titles
            $('.accordion-title').not($(this)).removeClass('active');		
        });
    });

    // Products Filter Options
    $(function(){
        $(".icon-view-one").on("click", function(e){
            e.preventDefault();
            document.getElementById("products-collections-filter").classList.add('products-col-one')
            document.getElementById("products-collections-filter").classList.remove('products-col-two', 'products-col-three', 'products-col-four', 'products-row-view');
        });
        $(".icon-view-two").on("click", function(e){
            e.preventDefault();
            document.getElementById("products-collections-filter").classList.add('products-col-two')
            document.getElementById("products-collections-filter").classList.remove('products-col-one', 'products-col-three', 'products-col-four', 'products-row-view');
        });
        $(".icon-view-three").on("click", function(e){
            e.preventDefault();
            document.getElementById("products-collections-filter").classList.add('products-col-three')
            document.getElementById("products-collections-filter").classList.remove('products-col-one', 'products-col-two', 'products-col-four', 'products-row-view');
        });
        $(".icon-view-four").on("click", function(e){
            e.preventDefault();
            document.getElementById("products-collections-filter").classList.add('products-col-four')
            document.getElementById("products-collections-filter").classList.remove('products-col-one', 'products-col-two', 'products-col-three', 'products-row-view');
        });
        $(".view-grid-switch").on("click", function(e){
            e.preventDefault();
            document.getElementById("products-collections-filter").classList.add('products-row-view')
            document.getElementById("products-collections-filter").classList.remove('products-col-one', 'products-col-two', 'products-col-three', 'products-col-four');
        });
        $(".icon-view-six").on("click", function(e){
            e.preventDefault();
            document.getElementById("products-collections-filter").classList.add('products-col-six')
            document.getElementById("products-collections-filter").classList.remove('products-col-one', 'products-col-two', 'products-col-three', 'products-col-four', 'products-row-view');
        });
    });
    $('.products-filter-options .view-column a').on('click', function(){
        $('.view-column a').removeClass("active");
        $(this).addClass("active");
    });
    
    // Nice Select JS
    $('select').niceSelect();

    // Blog Slides
    $('.blog-slides').owlCarousel({
        loop: true,
        nav: false,
        dots: true,
        autoplayHoverPause: true,
        autoplay: true,
        margin: 30,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 1,
            },
            768: {
                items: 2,
            },
            1200: {
                items: 3,
            }
        }
    });

    // Subscribe form
    $(".newsletter-form").validator().on("submit", function (event) {
        if (event.isDefaultPrevented()) {
        // handle the invalid form...
            formErrorSub();
            submitMSGSub(false, "Please enter your email correctly.");
        } else {
            // everything looks good!
            event.preventDefault();
        }
    });
    function callbackFunction (resp) {
        if (resp.result === "success") {
            formSuccessSub();
        }
        else {
            formErrorSub();
        }
    }
    function formSuccessSub(){
        $(".newsletter-form")[0].reset();
        submitMSGSub(true, "Thank you for subscribing!");
        setTimeout(function() {
            $("#validator-newsletter").addClass('hide');
        }, 4000)
    }
    function formErrorSub(){
        $(".newsletter-form").addClass("animate__animated animate__shake");
        setTimeout(function() {
            $(".newsletter-form").removeClass("animate__animated animate__shake");
        }, 1000)
    }
    function submitMSGSub(valid, msg){
        if(valid){
            var msgClasses = "validation-success";
        } else {
            var msgClasses = "validation-danger";
        }
        $("#validator-newsletter").removeClass().addClass(msgClasses).text(msg);
    }
    // AJAX MailChimp
    $(".newsletter-form").ajaxChimp({
        url: "https://hibootstrap.us20.list-manage.com/subscribe/post?u=60e1ffe2e8a68ce1204cd39a5&amp;id=42d6d188d9", // Your url MailChimp
        callback: callbackFunction
    });

    // Popup Image
    $('.popup-btn').magnificPopup({
        type: 'image',
        removalDelay: 300,
        gallery: {
            enabled:true
        },
        callbacks: {
            beforeOpen: function() {
                this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure animated ' + this.st.el.attr('data-effect'));
            }
        },
    });

    // Isotop Js
    var $grid = $('.gallery-items, .blog-items, .lookbook-items').isotope({
        itemSelector: '.grid-item',
        percentPosition: true,
        masonry: {
            // Use outer width of grid-sizer for columnWidth
            columnWidth: '.grid-item'
        }
    });

    // Article Image Slides
    $('.article-image-slides').owlCarousel({
        loop: true,
        nav: true,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        animateOut: 'fadeOut',
        items: 1,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
    });

    // Sidebar Sticky
    $('.products-details-desc-sticky').stickySidebar({
        topSpacing: 110,
        bottomSpacing: 110
    });

    // Products Details Image Slides
    $('.products-details-image-slides').slick({
        dots: true,
        speed: 500,
        fade: false,
        slide: 'li',
        slidesToShow: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        prevArrow: false,
        nextArrow: false,
        responsive: [{
            breakpoint: 800,
            settings: {
                arrows: false,
                centerMode: false,
                centerPadding: '40px',
                variableWidth: false,
                slidesToShow: 1,
                dots: true
            },
            breakpoint: 1200,
            settings: {
                arrows: false,
                centerMode: false,
                centerPadding: '40px',
                variableWidth: false,
                slidesToShow: 1,
                dots: true
            }
        }],
        customPaging: function (slider, i) {
            return '<button class="tab">' + $('.slick-thumbs li:nth-child(' + (i + 1) + ')').html() + '</button>';
        }
    });

    // Products Details Image Slides Style 2
    $('.products-details-image-slider').owlCarousel({
        loop: true,
        nav: true,
        dots: false,
        autoplayHoverPause: true,
        autoplay: true,
        margin: 30,
        navText: [
            "<i class='flaticon-left'></i>",
            "<i class='flaticon-right-arrow'></i>"
        ],
        responsive: {
            0: {
                items: 1,
            },
            576: {
                items: 2,
            },
            768: {
                items: 2,
            },
            1200: {
                items: 3,
            }
        }
    });

    // Count Time 
    function makeTimer() {
        var endTime = new Date("September 20, 2025 17:00:00 PDT");			
        var endTime = (Date.parse(endTime)) / 1000;
        var now = new Date();
        var now = (Date.parse(now) / 1000);
        var timeLeft = endTime - now;
        var days = Math.floor(timeLeft / 86400); 
        var hours = Math.floor((timeLeft - (days * 86400)) / 3600);
        var minutes = Math.floor((timeLeft - (days * 86400) - (hours * 3600 )) / 60);
        var seconds = Math.floor((timeLeft - (days * 86400) - (hours * 3600) - (minutes * 60)));
        if (hours < "10") { hours = "0" + hours; }
        if (minutes < "10") { minutes = "0" + minutes; }
        if (seconds < "10") { seconds = "0" + seconds; }
        $("#days").html(days + "<span>Days</span>");
        $("#hours").html(hours + "<span>Hours</span>");
        $("#minutes").html(minutes + "<span>Minutes</span>");
        $("#seconds").html(seconds + "<span>Seconds</span>");
    }
    setInterval(function() { makeTimer(); }, 0);

    // Go to Top
    $(function(){
        // Scroll Event
        $(window).on('scroll', function(){
            var scrolled = $(window).scrollTop();
            if (scrolled > 300) $('.go-top').addClass('active');
            if (scrolled < 300) $('.go-top').removeClass('active');
        });  
        // Click Event
        $('.go-top').on('click', function() {
            $("html, body").animate({ scrollTop: "0" },  500);
        });
    });

	// WoW JS
	$(window).on ('load', function (){
        if ($(".wow").length) { 
            var wow = new WOW ({
                boxClass:     'wow',      // Animated element css class (default is wow)
                animateClass: 'animated', // Animation css class (default is animated)
                offset:       20,         // Distance to the element when triggering the animation (default is 0)
                mobile:       true,       // Trigger animations on mobile devices (default is true)
                live:         true,       // Act on asynchronously loaded content (default is true)
            });
            wow.init();
        }
    });

    // Switch Btn
	$('body').append("<div class='switch-box'><label id='switch' class='switch'><input type='checkbox' onchange='toggleTheme()' id='slider'><span class='slider round'></span></label></div>");

}(jQuery));

// function to set a given theme/color-scheme
function setTheme(themeName) {
    localStorage.setItem('xton_theme', themeName);
    document.documentElement.className = themeName;
}
// function to toggle between light and dark theme
function toggleTheme() {
    if (localStorage.getItem('xton_theme') === 'theme-dark') {
        setTheme('theme-light');
    } else {
        setTheme('theme-dark');
    }
}
// Immediately invoked function to set the theme on initial load
(function () {
    if (localStorage.getItem('xton_theme') === 'theme-dark') {
        setTheme('theme-dark');
        document.getElementById('slider').checked = false;
    } else {
        setTheme('theme-light');
    document.getElementById('slider').checked = true;
    }
})();