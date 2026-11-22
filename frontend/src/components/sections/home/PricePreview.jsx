import SectionHeading from '../../ui/SectionHeading'
import Button from '../../ui/Button'
import DeviceFinder from '../../DeviceFinder'

// "Find your phone" section on the Home page
export default function PricePreview() {
  return (
    <section id="prices" className="mx-auto max-w-[1200px] scroll-mt-24 px-6">
      <SectionHeading
        align="center"
        eyebrow="Find your phone"
        title="Find your phone"
        text="Pick your brand or search your model. Then tell us what’s wrong and we agree your price."
      />
      <div className="mt-8">
        <DeviceFinder />
      </div>
      <div className="mt-8 text-center">
        <Button to="/prices" variant="dark">See how pricing works</Button>
      </div>
    </section>
  )
}
