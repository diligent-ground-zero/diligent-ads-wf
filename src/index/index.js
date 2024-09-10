import gsap from 'gsap'
// import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Swiper from 'swiper'
import {
  Navigation,
  Autoplay,
  Controller,
  EffectCards,
  EffectFade,
} from 'swiper/modules'

import '../styles/style.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-cards'
import 'swiper/css/effect-fade'

gsap.registerPlugin(ScrollTrigger)

export const initHomeSwipers = () => {
  const swiperLoopOptions = {
    spaceBetween: 20,
    loop: true,
    allowTouchMove: false,
    slidesPerView: '4',
    centeredSlides: true,
    modules: [Autoplay],
    autoplay: {
      delay: 0,
      pauseOnMouseEnter: false,
      disableOnInteraction: false,
    },
    breakpoints: {
      992: {
        slidesPerView: '3',
      },
    },
    speed: 5000,
  }
  new Swiper('#loop-swiper-1', swiperLoopOptions)

  new Swiper('#loop-swiper-2', swiperLoopOptions)

  const photoSwiper = new Swiper('.swiper.is-photos', {
    effect: 'cards',
    grabCursor: false,
    loop: true,
    keyboard: false,
    modules: [Navigation, Controller, EffectCards],
    navigation: {
      nextEl: '.arrow.is-right',
      prevEl: '.arrow.is-left',
    },
    cardsEffect: {
      perSlideOffset: 2,
      perSlideRotate: 0,
      rotate: false,
      slideShadows: false,
    },
    speed: 700,
  })

  const contentSwiper = new Swiper('.swiper.is-content', {
    loop: true,
    followFinger: false,
    effect: 'fade',
    fadeEffect: {
      crossFade: true,
    },
    navigation: {
      nextEl: '.arrow.is-right',
      prevEl: '.arrow.is-left',
    },
    modules: [Controller, EffectFade],
  })

  photoSwiper.controller.control = contentSwiper
  contentSwiper.controller.control = photoSwiper
}

export function initFaqs() {
  const faqs = document.querySelector('#faq')
  const faqItems = faqs.querySelectorAll('.faq_accordion .faq_question')

  initArrowCircles(faqs)

  faqItems.forEach((item) => {
    item.addEventListener('click', () => handleFaqClick(item, faqItems))
  })
}

function initArrowCircles(faqs) {
  const arrowCircles = faqs.querySelectorAll('.arrow_circle svg')
  arrowCircles.forEach((svg) => {
    svg.style.setProperty('--color-bg-faq', '#f0f0f0')
    svg.style.setProperty('--color-arrow-faq', '#1F1F1F')
    svg.style.transition =
      'transform 0.3s ease-in-out, background-color 0.3s ease-in-out'
    svg.dataset.clickCount = '0'
  })
}

function handleFaqClick(clickedItem, allItems) {
  const parent = clickedItem.closest('.faq_accordion')
  const isOpen = parent.classList.toggle('open')

  updateSvg(parent.querySelector('.arrow_circle svg'), isOpen)
  closeOtherFaqs(clickedItem, allItems)
}

function updateSvg(svg, isOpen) {
  if (!svg) return

  svg.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)'

  if (isOpen) {
    svg.dataset.clickCount = (parseInt(svg.dataset.clickCount) + 1).toString()
    updateSvgColor(svg)
    svg.style.setProperty('--color-arrow-faq', '#f0f0f0') // Change arrow color when open
  } else {
    resetSvg(svg)
  }
}

function updateSvgColor(svg) {
  const colors = ['#f0f0f0', '#1F1F1F', '#d0d0d0']
  const colorIndex = Math.min(
    parseInt(svg.dataset.clickCount),
    colors.length - 1
  )
  svg.style.setProperty('--color-bg-faq', colors[colorIndex])
}

function resetSvg(svg) {
  svg.dataset.clickCount = '0'
  svg.style.setProperty('--color-bg-faq', '#f0f0f0')
  svg.style.setProperty('--color-arrow-faq', '#1F1F1F') // Reset arrow color when closed
}

function closeOtherFaqs(clickedItem, allItems) {
  allItems.forEach((item) => {
    if (item !== clickedItem) {
      const parent = item.closest('.faq_accordion')
      parent.classList.remove('open')
      resetSvg(parent.querySelector('.arrow_circle svg'))
    }
  })
}

export const splitTextAnimation = () => {
  if (window.innerWidth > 992) {
    createAnimation()
  }
  function createAnimation() {
    const introContent = document.querySelector('.section_intro')
    const panels = gsap.utils.toArray('.intro_content')
    const section_ads_first = document.querySelector('.section_ads_first')

    const adsInSecond = gsap.utils.toArray('.section_ads .ads_image')

    const adsExceptFourth = adsInSecond.filter((_, index) => index !== 3)

    gsap.set(adsExceptFourth, { opacity: 0 })

    gsap.set(adsInSecond[3], {
      position: 'absolute',
      zIndex: (i) => 5 - i,
      scale: (i) => {
        return i > 0 ? 1.2 : 1.4
      },
      y: window.innerWidth > 920 ? -500 : -50,
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section_ads_first,
        start: 'top',
        end: 'bottom',
        scrub: 1,
      },
    })

    tl.to(adsInSecond[3], {
      y: 0,
      scale: 1,
      ease: 'power1.out',
      duration: 2,
    })

    tl.to(
      adsExceptFourth,
      {
        y: 0,
        opacity: 1,
      },
      '-=1'
    )

    tl.to(adsInSecond.splice(0, 6), {
      x: '50px',
      duration: 2,
    })

    tl.to(
      adsInSecond.slice(-5),
      {
        x: '-50px',
        duration: 2,
      },
      '<'
    )

    panels.forEach((panel) => {
      gsap.timeline({
        scrollTrigger: {
          trigger: introContent,
          start: 'top top',
          toggleActions: 'play reverse play reverse',
        },
      })

      tl.to(panel, { opacity: 1, duration: 0.5 })
    })

    // setupVideoAutoplay()
    // function setupVideoAutoplay() {
    //   const videoWrapper = document.querySelector('#first_video')
    //   const video = videoWrapper?.querySelector('video')

    //   if (!video) return

    //   ScrollTrigger.create({
    //     trigger: videoWrapper,
    //     start: 'top 80%',
    //     end: 'bottom 20%',
    //     onEnter: () => video.play(),
    //     onLeave: () => video.pause(),
    //     onEnterBack: () => video.play(),
    //     onLeaveBack: () => video.pause(),
    //   })
    // }
  }
}

export const langaugeToggle = () => {
  // Get the price paragraph elements
  const basicPriceElement = document.getElementById('basic-package-price')
  const betterPriceElement = document.getElementById('better-package-price')

  // Get the currency toggle buttons
  const euroButton = document.querySelector('#euro')
  const dollarButton = document.querySelector('#dollar')
  const currencyToggle = document.querySelector('#currency_toggle')

  // Set the initial prices (you can adjust these values)
  const prices = {
    euro: {
      basic: 1500,
      better: 2900,
    },
    usd: {
      basic: 1500,
      better: 2900,
    },
  }

  // Function to update the price text
  function updatePrices(currency) {
    const currencySymbol = currency === 'euro' ? 'EUR' : 'USD'
    const basicPrice = prices[currency].basic
    const betterPrice = prices[currency].better

    basicPriceElement.textContent = `${basicPrice} ${currencySymbol}`
    betterPriceElement.textContent = `${betterPrice} ${currencySymbol}`
  }

  // Add click event listener to the toggle button
  currencyToggle.addEventListener('click', function () {
    if (euroButton.classList.contains('active')) {
      updatePrices('usd')
      euroButton.classList.remove('active')
      dollarButton.classList.add('active')
    } else {
      updatePrices('euro')
      euroButton.classList.add('active')
      dollarButton.classList.remove('active')
    }
  })

  // Initialize with Euro prices
  updatePrices('usd')
}
