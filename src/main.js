import {
  initHomeSwipers,
  initFaqs,
  splitTextAnimation,
  langaugeToggle,
  initCounter,
  initNavigation,
  linkedinAdsConversion,
  initCookieModal,
  initTabs,
  initWhatYouGetAnimations,
  figmaIframeAdjust,
} from './index'

const getCurrentPath = () => window.location.pathname

const loadScripts = () => {
  const currentPath = getCurrentPath()

  initNavigation()
  linkedinAdsConversion()
  initCookieModal()

  if (currentPath === '/' || currentPath === '/home-new') {
    initTabs()
    initHomeSwipers()
    splitTextAnimation()
    initCounter()
    langaugeToggle()
    initFaqs()
    initWhatYouGetAnimations()
    figmaIframeAdjust()
  }

  if (currentPath.includes('/faq')) {
    initFaqs()
  }
}

loadScripts()
