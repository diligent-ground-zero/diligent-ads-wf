import {
  initHomeSwipers,
  initFaqs,
  splitTextAnimation,
  initCounter,
  initNavigation,
  linkedinAdsConversion,
  initCookieModal,
  initTabs,
  initWhatYouGetAnimations,
  figmaIframeAdjust,
  initStepperReferrals,
  initCopyToClipboard,
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
    initFaqs()
    initWhatYouGetAnimations()
    figmaIframeAdjust()
  }

  if (currentPath.includes('/referrals')) {
    initFaqs()
    initStepperReferrals()
    initCopyToClipboard()
  }

  if (
    currentPath.includes('/services/ad-design-service-for-b2b-saas') ||
    currentPath.includes('/services/gif-design-service-for-b2b-saas')
  ) {
    initFaqs()
  }
}

loadScripts()
