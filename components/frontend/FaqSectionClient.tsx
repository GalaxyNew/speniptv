'use client'

import { useState } from 'react'
import EditableText from './EditableText'

interface FaqItem {
  q: string
  a: string
  qKey: string
  aKey: string
}

interface FaqSectionClientProps {
  locale: string
  isEditMode: boolean
  c: Record<string, string>
  faqs: FaqItem[]
  btnProps?: any
}

export default function FaqSectionClient({ locale, isEditMode, c, faqs, btnProps }: FaqSectionClientProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0) // Open first item by default

  const defaultSubtitles: Record<string, string> = {
    es: "Quedamos a su disposición para cualquier solicitud de información, prioritariamente por WhatsApp o por correo electrónico.",
    fr: "Nous restons à votre disposition pour toute demande d'information, par WhatsApp en priorité ou par e-mail.",
    en: "We remain at your disposal for any request for information, by WhatsApp in priority or by email.",
    zh: "我们随时为您提供任何信息咨询服务，优先通过 WhatsApp 或电子邮件联系我们。"
  }
  const defaultBtnTexts: Record<string, string> = {
    es: "Contáctanos",
    fr: "Contactez-nous",
    en: "Contact us",
    zh: "联系我们"
  }

  const toggleAccordion = (index: number) => {
    setActiveIndex(prev => prev === index ? null : index)
  }

  return (
    <div className="container">
        <div className="faq-grid-layout">
          {/* Left Column */}
          <div className="faq-left-block">
            <div className="badge-anchor" style={{ marginBottom: '0.75rem' }}>
              <span className="badge">
                <EditableText moduleId="faq" locale={locale} fieldKey="badge" tag="span" isEditMode={isEditMode}>
                  {c.badge ?? 'FAQ'}
                </EditableText>
              </span>
            </div>
            <h2>
              <EditableText moduleId="faq" locale={locale} fieldKey="title" tag="span" isEditMode={isEditMode}>
                {c.title ?? (locale === 'es' ? '¿Tienes más preguntas?' : 'Vous Avez Encore Des Questions ?')}
              </EditableText>
            </h2>
            <p>
              <EditableText moduleId="faq" locale={locale} fieldKey="subtitle" tag="span" isEditMode={isEditMode}>
                {c.subtitle ?? defaultSubtitles[locale] ?? defaultSubtitles.en}
              </EditableText>
            </p>
            <a
              {...btnProps}
              className="faq-contact-btn"
            >
              <EditableText moduleId="faq" locale={locale} fieldKey="btn_text" tag="span" isEditMode={isEditMode} noLink={true}>
                {c.btn_text ?? defaultBtnTexts[locale] ?? defaultBtnTexts.en}
              </EditableText>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>➔</span>
            </a>
          </div>

          {/* Right Column (Accordion Block) */}
          <div className="faq-accordion-block">
            {faqs.map((faq, i) => {
              const isActive = activeIndex === i
              return (
                <div
                  key={i}
                  className={`faq-accordion-item ${isActive ? 'active' : ''}`}
                >
                  <div
                    className="faq-accordion-header"
                    onClick={() => toggleAccordion(i)}
                  >
                    <span className="faq-accordion-title">
                      <EditableText moduleId="faq" locale={locale} fieldKey={faq.qKey} tag="span" isEditMode={isEditMode}>
                        {faq.q}
                      </EditableText>
                    </span>
                    <span className="faq-accordion-arrow">
                      {isActive ? '▲' : '▼'}
                    </span>
                  </div>
                  <div
                    className="faq-accordion-content"
                    style={{
                      maxHeight: isActive ? '200px' : '0',
                    }}
                  >
                    <p style={{ margin: 0, paddingTop: '0.25rem' }}>
                      <EditableText moduleId="faq" locale={locale} fieldKey={faq.aKey} tag="span" isEditMode={isEditMode}>
                        {faq.a}
                      </EditableText>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
    </div>
  )
}
