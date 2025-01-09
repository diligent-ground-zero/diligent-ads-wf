import PureCounter from '@srexi/purecounterjs'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Swiper from 'swiper'
import {
  Navigation,
  Autoplay,
  Controller,
  EffectCards,
  EffectFade,
} from 'swiper/modules'
import CookieConsent from 'vanilla-cookieconsent/dist/cookieconsent.umd.js'

import { horizontalLoop } from '../utils/scroller'
import '../styles/style.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-cards'
import 'swiper/css/effect-fade'

gsap.registerPlugin(ScrollTrigger)

export const initPriceCalculator = () => {
  const PRICE_PER_AD = 160
  const priceCalculator = document.querySelector('#calculating_pricing_card')
  const secondaryLabel = priceCalculator.querySelector(
    '#basic-package-price-value-label-secondary'
  )
  const labelValue = priceCalculator.querySelector(
    '#basic-package-price-value-label'
  )
  const numberOfAdsInput = priceCalculator.querySelector('#number_of_ads')
  const increaseNrOfAdsInput = priceCalculator.querySelector(
    '#increase_nr_of_ads'
  )
  const decreaseNrOfAdsInput = priceCalculator.querySelector(
    '#decrease_nr_of_ads'
  )

  increaseNrOfAdsInput.addEventListener('click', () => {
    numberOfAdsInput.value = parseInt(numberOfAdsInput.value) + 1
    calculatePrice()
  })

  decreaseNrOfAdsInput.addEventListener('click', () => {
    if (numberOfAdsInput.value > 24) {
      numberOfAdsInput.value = parseInt(numberOfAdsInput.value) - 1
    }
    calculatePrice()
  })

  const calculatePrice = () => {
    const numberOfAds = parseInt(numberOfAdsInput.value)
    const totalPrice = numberOfAds * PRICE_PER_AD
    labelValue.textContent = `$${totalPrice.toFixed(0)}/`
    secondaryLabel.textContent = parseInt(numberOfAdsInput.value)
    numberOfAdsInput.dispatchEvent(new Event('change'))
  }

  const updateDecreaseButtonState = () => {
    console.log(numberOfAdsInput.value)
    decreaseNrOfAdsInput.disabled = parseInt(numberOfAdsInput.value) === 24
  }

  calculatePrice()
  updateDecreaseButtonState()
  numberOfAdsInput.addEventListener('change', updateDecreaseButtonState)
}

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
    allowTouchMove: false,
    keyboard: false,
    initialSlide: 1,
    modules: [Navigation, Controller, EffectCards],
    navigation: {
      nextEl: '.arrow.is-right',
      prevEl: '.arrow.is-left',
    },
    cardsEffect: {
      rotate: false,
      slideShadows: false,
    },
    speed: 700,
  })

  const contentSwiper = new Swiper('.swiper.is-content', {
    loop: true,
    followFinger: false,
    allowTouchMove: false,
    effect: 'fade',
    initialSlide: 1,
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
    // createAnimation()
  } else {
    gsap.utils
      .toArray('.section_ads_animation_wrapper .ads_row')
      .forEach((line, index) => {
        const speed = 0.08 // (in pixels per second)
        horizontalLoop(line, {
          speed: speed,
          reversed: index === 0,
          repeat: -1,
        })
      })
  }

  const panels = gsap.utils.toArray('.intro_content')
  panels.forEach((panel) => {
    gsap.set(panel, { opacity: 0, y: 40 })
    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'top bottom',
        end: 'bottom',
        // scrub: 1,
      },
    })
    tl2.to(panel, { opacity: 1, y: 0, delay: 0.5 })

    setupVideoAutoplay()
    function setupVideoAutoplay() {
      const videos = gsap.utils.toArray('.step_video')

      videos.forEach((video) => {
        const videoInside = video.querySelector('video')
        gsap.from(videoInside, {
          scrollTrigger: {
            trigger: videoInside,
            start: 'top',
          },
          onEnter: () => {
            videoInside.play()
          },
        })
      })
    }
  })

  // function createAnimation() {
  //   const section_ads_first = document.querySelector('.section_ads_first')

  //   const adsInSecond = gsap.utils.toArray('.section_ads .ads_image')

  //   const adsExceptFourth = adsInSecond.filter((_, index) => index !== 3)

  //   gsap.set(adsExceptFourth, { opacity: 0 })
  //   const ele = createBackgroundDiv(
  //     'right',
  //     document.querySelector('.ads_image.hidden')
  //   )

  //   gsap.set(gsap.utils.toArray([adsInSecond[3], ele]), {
  //     position: 'absolute',
  //     zIndex: (i) => 5 - i,
  //     scale: (i) => {
  //       return i > 0 ? 1.2 : 1.4
  //     },
  //     y: window.innerWidth > 920 ? -500 : -50,
  //   })

  //   const tl = gsap.timeline({
  //     scrollTrigger: {
  //       trigger: section_ads_first,
  //       start: 'top',
  //       end: 'bottom',
  //       scrub: 1,
  //     },
  //   })

  //   tl.to(adsInSecond[3], {
  //     y: 0,
  //     scale: 1,
  //     ease: 'power1.out',
  //     duration: 2,
  //   })

  //   tl.to(
  //     adsExceptFourth,
  //     {
  //       y: 0,
  //       opacity: 1,
  //     },
  //     '-=1'
  //   )

  //   tl.to(adsInSecond.splice(0, 6), {
  //     x: '100px',
  //     duration: 4,
  //   })

  //   tl.to(
  //     adsInSecond.slice(-5),
  //     {
  //       x: '-100px',
  //       duration: 4,
  //     },
  //     '<'
  //   )
  // }
}

// function createBackgroundDiv(side, parent) {
//   const div = document.createElement('div')
//   div.className = `black-bg ${side}`
//   div.style.cssText = `
//     position: absolute;
//     top: 0;
//     bottom: 0;
//     ${side}: -20%;
//     width: 20%;
//     background-color: black;
//     z-index: 1;
//   `
//   parent.appendChild(div)
//   return div
// }

export const initCounter = () => {
  new PureCounter({
    // Setting that can't' be overriden on pre-element
    selector: '.subs', // HTML query selector for spesific element

    // Settings that can be overridden on per-element basis, by `data-purecounter-*` attributes:
    start: 0, // Starting number [unit]
    end: 1000, // End number [unit]
    duration: 2, // The time in seconds for the animation to complete [seconds]
    delay: 10, // The delay between each iteration (the default of 10 will produce 100 fps) [miliseconds]
    once: true, // Counting at once or recount when the element in view [boolean]
    repeat: false, // Repeat count for certain time [boolean:false|seconds]
    decimals: 0, // How many decimal places to show. [unit]
    legacy: true, // If this is true it will use the scroll event listener on browsers
    filesizing: false, // This will enable/disable File Size format [boolean]
    currency: false, // This will enable/disable Currency format. Use it for set the symbol too [boolean|char|string]
    separator: false, // This will enable/disable comma separator for thousands. Use it for set the symbol too [boolean|char|string]
  })

  new PureCounter({
    // Setting that can't' be overriden on pre-element
    selector: '.visitors', // HTML query selector for spesific element

    // Settings that can be overridden on per-element basis, by `data-purecounter-*` attributes:
    start: 0, // Starting number [unit]
    end: 100, // End number [unit]
    duration: 2, // The time in seconds for the animation to complete [seconds]
    delay: 10, // The delay between each iteration (the default of 10 will produce 100 fps) [miliseconds]
    once: true, // Counting at once or recount when the element in view [boolean]
    repeat: false, // Repeat count for certain time [boolean:false|seconds]
    decimals: 0, // How many decimal places to show. [unit]
    legacy: true, // If this is true it will use the scroll event listener on browsers
    filesizing: false, // This will enable/disable File Size format [boolean]
    currency: false, // This will enable/disable Currency format. Use it for set the symbol too [boolean|char|string]
    separator: false, // This will enable/disable comma separator for thousands. Use it for set the symbol too [boolean|char|string]
  })
}

export const langaugeToggle = () => {
  // Get the price paragraph elements
  const basicPriceElement = document.getElementById('basic-package-price')
  const betterPriceElement = document.getElementById('better-package-price')
  const discount = document.getElementById('discount')

  // Get the currency toggle buttons
  const euroButton = document.querySelector('#euro')
  const dollarButton = document.querySelector('#dollar')
  const currencyToggle = document.querySelector('#currency_toggle')

  // Set the initial prices (you can adjust these values)
  const prices = {
    euro: {
      basic: 1350,
      better: 2650,
      discount: 387,
    },
    usd: {
      basic: 1500,
      better: 2900,
      discount: 475,
    },
  }

  // Function to update the price text
  function updatePrices(currency) {
    const currencySymbol = currency === 'euro' ? 'EUR' : 'USD'
    const basicPrice = prices[currency].basic
    const betterPrice = prices[currency].better
    const discountValue = prices[currency].discount

    basicPriceElement.textContent = `${basicPrice} ${currencySymbol}`
    betterPriceElement.textContent = `${betterPrice} ${currencySymbol}`
    discount.textContent = `You save: ${discountValue} ${currencySymbol}`
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

export function initNavigation() {
  const navButton = document.querySelector('.nav_button')
  const hamburgerOpen = document.querySelector('.hamburger_open')
  const hamburgerClose = document.querySelector('.hamburger_close')
  const navMenu = document.querySelector('.nav_menu')
  const navLinks = navMenu.querySelectorAll('a')
  const parentWrap = document.querySelector('.nav_component')
  let isOpen = false

  // Create a blurry background element
  const blurryBg = document.createElement('div')
  blurryBg.classList.add('blurry-bg')
  document.body.appendChild(blurryBg)

  // Create a container for centered menu items
  const centeredMenu = document.createElement('div')
  centeredMenu.classList.add('centered-menu')
  document.body.appendChild(centeredMenu)

  function toggleMenu() {
    isOpen = !isOpen

    hamburgerOpen.classList.toggle('hide', isOpen)
    hamburgerClose.classList.toggle('hide', !isOpen)

    if (isOpen) {
      // Open menu animation
      gsap.to(blurryBg, { opacity: 1, duration: 0.3, pointerEvents: 'auto' })
      parentWrap.style.backgroundImage = 'unset'
      centeredMenu.style.display = 'flex'
      gsap.fromTo(
        centeredMenu,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, delay: 0.1 }
      )

      // Animate menu items
      gsap.fromTo(
        navLinks,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, delay: 0.2 }
      )
    } else {
      // Close menu animation
      gsap.to(blurryBg, { opacity: 0, duration: 0.3, pointerEvents: 'none' })
      gsap.to(centeredMenu, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
          centeredMenu.style.display = 'none'
        },
      })
      gsap.to(parentWrap, {
        backgroundImage:
          'linear-gradient(#dcdbd7 18%, #dcdbd7ab 50%, #dcdbd700 71%)',
      })
    }
  }

  navButton.addEventListener('click', toggleMenu)

  // Clone nav links to centered menu
  navLinks.forEach((link, index) => {
    const clonedLink = link.cloneNode(true)
    centeredMenu.appendChild(clonedLink)

    if (index === navLinks.length - 1) {
      clonedLink.classList.add('alternative')
    }

    clonedLink.addEventListener('click', () => {
      toggleMenu()
    })
  })
}

export const linkedinAdsConversion = () => {
  const ctaButtons = document.querySelectorAll('a.cta_button_component')
  ctaButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Check if LinkedIn Insight tag is available
      if (window.lintrk) {
        window.lintrk('track', { conversion_id: 14999516 })
      } else {
        console.warn('LinkedIn Insight tag is not available')
      }
    })
  })
}

export const initCookieModal = () => {
  document.documentElement.classList.add('cc--darkmode')
  CookieConsent.run({
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {},
    },
    guiOptions: {
      consentModal: {
        layout: 'bar inline',
        position: 'bottom',
      },
    },
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description:
              'Our website uses cookies to ensure normal operation, alongside analytics, marketing & advertising services.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage Individual preferences',
          },
          preferencesModal: {
            title: 'Manage cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Accept current selection',
            closeIconLabel: 'Close modal',
            sections: [
              {
                title: 'Somebody said ... cookies?',
                description: 'I want one!',
              },
              {
                title: 'Strictly Necessary cookies',
                description:
                  'These cookies are essential for the proper functioning of the website and cannot be disabled.',

                //this field will generate a toggle linked to the 'necessary' category
                linkedCategory: 'necessary',
              },
              {
                title: 'Performance and Analytics',
                description:
                  'These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.',
                linkedCategory: 'analytics',
              },
              {
                title: 'More information',
                description:
                  'For any queries in relation to my policy on cookies and your choices, please <a href="#contact-page">contact us</a>',
              },
            ],
          },
        },
      },
    },
  })
}

export const initTabs = () => {
  document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.how_it_works_tabs_item')
    const contents = document.querySelectorAll('.how_it_works_tabs_content_tab')
    let animating = false // Flag to track if an animation is in progress

    // Initially hide all content tabs and set opacity to 0
    gsap.set(contents, { display: 'none', opacity: 0 })
    if (contents.length > 0) {
      gsap.set(contents[0], { display: 'flex', opacity: 1 }) // Show the first tab content
      tabs[0].classList.add('active') // Set the first tab as active
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', function () {
        if (animating || this.classList.contains('active')) return // Prevent new animation if one is already in progress or if the tab is already active
        animating = true // Set the flag to true as animation starts

        // Remove active class from all tabs
        tabs.forEach((innerTab) => {
          innerTab.classList.remove('active')
        })

        // Animate all content tabs to hide them
        contents.forEach((content, idx) => {
          if (idx !== index) {
            gsap.to(content, {
              opacity: 0,
              onComplete: () => {
                gsap.set(content, { display: 'none' })
                animating = false // Reset the flag when animation completes
              },
            })
          } else {
            // Immediately hide the current content when another tab is clicked
            gsap.set(content, { display: 'none', opacity: 0 })
          }
        })

        // Add active class to the clicked tab
        this.classList.add('active')
        // Display and animate the corresponding content tab
        gsap.set(contents[index], { display: 'flex' })
        gsap.to(contents[index], {
          opacity: 1,
          onComplete: () => {
            animating = false // Reset the flag when animation completes
          },
        })
      })
    })
  })
}

export const initWhatYouGetAnimations = () => {
  let mm = gsap.matchMedia()
  mm.add('(min-width: 993px)', () => {
    const images = gsap.utils.toArray(
      '.what_you_get_image_container .what_you_get_image_container_image'
    )

    ScrollTrigger.create({
      trigger: '.what_you_get_image_container',
      start: 'top center',
      end: 'bottom center',
      once: true, // Ensures the animation only runs once per page load
      onEnter: () => {
        gsap.fromTo(
          images,
          {
            opacity: 0,
          },
          {
            duration: 2,
            opacity: 1,
            ease: 'back.out(1.7)',
            scale: () => 0.95 + Math.random() * 0.1,
            rotation: () =>
              Math.random() * 7.5 * (Math.random() < 0.5 ? -1 : 1),
            stagger: 1,
          }
        )
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  })
}

export const figmaIframeAdjust = () => {
  const iframe = document.querySelector('.figma-iframe')
  if (iframe) {
    const parentContainer = iframe.parentElement
    const width = parentContainer.offsetWidth
    const height = parentContainer.offsetHeight
    iframe.style.width = `${width}px`
    iframe.style.height = `${height}px`
  }
}
