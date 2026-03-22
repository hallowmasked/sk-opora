/**
 * Libraries Initialization
 * Slick Carousel, FancyBox, TouchSwipe
 */

(function($) {
  'use strict';

  $(document).ready(function() {

    // ========================================
    // Slick Carousel для отзывов
    // ========================================
    if ($('.reviews-carousel__list').length) {
      $('.reviews-carousel__list').slick({
        slidesToShow: 2,
        slidesToScroll: 1,
        infinite: false,
        arrows: true,
        dots: false,
        prevArrow: '<button type="button" class="reviews-carousel__btn reviews-carousel__btn--prev slick-prev" aria-label="Предыдущий отзыв">‹</button>',
        nextArrow: '<button type="button" class="reviews-carousel__btn reviews-carousel__btn--next slick-next" aria-label="Следующий отзыв">›</button>',
        responsive: [
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1
            }
          }
        ],
        onInit: function() {
          $('.reviews-carousel__list').css('opacity', '1');
        }
      });
    }

    // ========================================
    // FancyBox для галереи
    // ========================================
    if ($('[data-fancybox]').length) {
      Fancybox.bind('[data-fancybox]', {
        Hash: false,
        Thumbs: {
          autoStart: true,
        },
      });
    }

    // ========================================
    // TouchSwipe для мобильных меню
    // ========================================
    if ($('.navbar-collapse').length) {
      $('.navbar-collapse').swipe({
        swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
          if (direction === 'left' || direction === 'right') {
            // Закрыть меню при свайпе в сторону
            $(this).collapse('hide');
          }
        },
        threshold: 75
      });
    }

  });

})(jQuery);
