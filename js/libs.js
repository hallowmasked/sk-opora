/* Инициализация библиотек */

(function($) {
  'use strict';

  $(document).ready(function() {

    /* Раздел: Карусель отзывов */
    if ($('.reviews-carousel__list').length) {
      $('.reviews-carousel__list').slick({
        slidesToShow: 2,
        slidesToScroll: 1,
        infinite: false,
        arrows: true,
        dots: false,
        prevArrow: '<button type="button" class="reviews-carousel__btn reviews-carousel__btn--prev slick-prev" aria-label="Предыдущий отзыв"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M12.8 3.8 6.6 10l6.2 6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
        nextArrow: '<button type="button" class="reviews-carousel__btn reviews-carousel__btn--next slick-next" aria-label="Следующий отзыв"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7.2 3.8 13.4 10l-6.2 6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
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

    /* Раздел: Галерея */
    if ($('[data-fancybox]').length) {
      Fancybox.bind('[data-fancybox]', {
        Hash: false,
        Thumbs: {
          autoStart: true,
        },
      });
    }

    /* Раздел: Свайпы */
    if ($('.navbar-collapse').length) {
      $('.navbar-collapse').swipe({
        swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
          if (direction === 'left' || direction === 'right') {
            $(this).collapse('hide');
          }
        },
        threshold: 75
      });
    }

  });

})(jQuery);
