import gsap from 'gsap'
// import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Flip from 'gsap/Flip'
import ScrollTrigger from 'gsap/ScrollTrigger'
import SplitType from 'split-type'
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
gsap.registerPlugin(Flip)

export const initHomeSwipers = () => {
  new Swiper('#loop-swiper-1, #loop-swiper-2', {
    spaceBetween: 20,
    grabCursor: false,
    a11y: false,
    freeMode: false,
    loop: true,
    allowTouchMove: false,
    slidesPerView: '3',
    modules: [Autoplay],
    centeredSlides: true,
    autoplay: {
      pauseOnMouseEnter: false,
      disableOnInteraction: false,
    },
    speed: 5000,
  })

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
  createAnimation()

  function createAnimation() {
    const introContent = document.querySelector('.section_intro')
    const panels = gsap.utils.toArray('.intro_content')
    const section_ads_first = document.querySelector('.section_ads_first')
    // const adsRows = document.querySelectorAll('.ads_row')
    // const section_ads = document.querySelector('.section_ads')

    const adsInSecond = gsap.utils.toArray('.section_ads .ads_image')

    // const adsExceptFourth = adsInSecond.filter((_, index) => index !== 3)

    // gsap.set(adsExceptFourth, {
    //   autoAlpha: 0,
    // })

    gsap.set(adsInSecond[3], {
      position: 'absolute',
      zIndex: (i) => 5 - i,
      scale: (i) => {
        return i > 0 ? 1.2 : 1.3
      },
      y: -500,
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section_ads_first,
        start: 'top top',
        end: 'bottom',
        markers: true,
        scrub: true,
      },
    })

    tl.to(adsInSecond[3], {
      y: 0,
      scale: 1,
    })

    // tl.to(adsExceptFourth, {
    //   autoAlpha: 1,
    // })
    // const state = Flip.getState(firstFiveAds)

    // gsap.set(firstFiveAds, {
    //   position: 'relative',
    // })

    // Flip.from(state, { duration: 2, ease: 'power1.inOut' })

    // if (adsRows.length >= 2) {
    //   const firstRow = adsRows[0]
    //   if (firstRow.children.length >= 3) {
    //     const thirdAd = firstRow.children[2].cloneNode(true)
    //     section_ads_first.appendChild(thirdAd)
    //   }
    // }

    // gsap.set(adsInSecond, { autoAlpha: 0 })

    // const tl = gsap.timeline({
    //   scrollTrigger: {
    //     trigger: section_ads_first,
    //     start: 'top top',
    //     end: 'bottom',
    //     markers: true,
    //   },
    // })

    // tl.to(section_ads_first.children[0], {
    //   y: '160%',
    // })

    // tl.to(
    //   section_ads_first.children[0],
    //   {
    //     autoAlpha: 0,
    //   },
    //   '+=0.25'
    // )

    // tl.to(
    //   adsInSecond.filter((_, index) => index !== 2),
    //   { autoAlpha: 1, y: 0 }
    // )

    // tl.to(
    //   adsInSecond.filter((_, index) => index === 2),
    //   { autoAlpha: 1, y: 0 },
    //   '-=0.5'
    // )

    // tl.to(section_ads, { autoAlpha: 1 }, '-=0.5')

    // const tl2 = gsap.timeline({
    //   scrollTrigger: {
    //     trigger: section_ads,
    //     start: 'top',
    //     end: 'bottom',
    //     scrub: true,
    //   },
    // })

    // tl2.to(section_ads, { autoAlpha: 1 })

    panels.forEach((panel, i) => {
      const splitWord = panel.querySelector('.split-word')

      if (splitWord) {
        // Split text into characters
        const text = new SplitType(splitWord, { types: 'words, chars' })

        // Set initial state for characters
        gsap.set(text.chars, {
          opacity: 0,
          y: 20,
        })

        // Create timeline for panel animation
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: introContent,
            start: 'top+=' + 100 * i + '%' + ' 20%',
            end: 'top+=' + 100 * (i + 1) + '%' + ' top',
            scrub: true,
            toggleActions: 'play reverse play reverse',
          },
        })

        // Animate panel and characters
        tl.to(panel, { opacity: 1, duration: 0.5 }).to(
          text.chars,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.02,
          },
          '<'
        )

        if (i < panels.length - 1) {
          tl.to(panel, { opacity: 0, duration: 0.5 }, '+=0.5').to(
            text.chars,
            {
              opacity: 0,
              y: -20,
              duration: 0.5,
              stagger: 0.02,
            },
            '<'
          )
        }
      }
    })

    ScrollTrigger.create({
      trigger: introContent,
      start: 'top 35%',
      end: '+=' + panels.length * 100 + '%',
      pin: true,
    })

    // ScrollTrigger.create({
    //   trigger: section_ads,
    //   start: 'top 50%',
    //   end: introContent,
    //   markers: true,
    // })

    setupVideoAutoplay()
    function setupVideoAutoplay() {
      const videoWrapper = document.querySelector('#first_video')
      const video = videoWrapper?.querySelector('video')

      if (!video) return

      ScrollTrigger.create({
        trigger: videoWrapper,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => video.play(),
        onLeave: () => video.pause(),
        onEnterBack: () => video.play(),
        onLeaveBack: () => video.pause(),
      })
    }
  }
}
