import {useState, useEffect, useContext} from 'react'
import { DataStateContext } from '../../context/dataStateContext'
import validationForm from '../../function/validationForm'
import {useQuery} from '@apollo/client'
import getPayData from '../../function/objednavka/payData'
import getDeliveryData from '../../function/objednavka/deliveryData'
import contactData from '../../function/objednavka/contactData'
import firmData from '../../function/objednavka/firmData'
import Checkout from '../../view/Checkout'
import axios from 'axios'
import {stateObj, errorObj} from '../../function/objednavka/objects'
import payQuery from '../../queries/pay'
import deliveryQuery from '../../queries/delivery'
// import {CreateOrder} from '../../queries/order'
import saleFrom from '../../function/objednavka/saleFrom'
import { client } from '../../lib/api'
import globalQuery from '../../queries/global'
import userQuery from '../../queries/user'
import buildImageUrl from '../../function/buildImageUrl'

const APP_API = process.env.APP_API

export async function getServerSideProps() {

  const { data: dataGl } = await client.query({query: globalQuery});
  const { data } = await client.query({query: userQuery});

  return {
    props: { 
      dataGl: dataGl,
      global: dataGl.global.data.attributes,
      meta: {
        title: "Objednávka",
      },
      navigation: data.navigation,
      basket: true
    }
  }
}

const CheckoutWrap = ({dataGl}) => {

  const [basketItems, setBasketItems] = useState([])
  const { dataContextState } = useContext(DataStateContext)
  const [startSum, setStartSum] = useState(0)
  const [sum, setSum] = useState(0)
  const [sale, setSale] = useState({value: 0, type: ''})

  const {data: payData} = useQuery(payQuery)
  const {data: deliveryData} = useQuery(deliveryQuery)
  // const [createOrder] = useMutation(CreateOrder)

  const [deliveryMethod, setDeliveryMethod] = useState([])
  const [payMethod, setPayMethod] = useState([])

  const [radioState, setRadioState] = useState("cz")

  const [deliveryAllow, setDeliveryAllow] = useState("all")
  const [paymentAllow, setPaymentsAllow] = useState("all")

  const [contactInfo, setContactInfo] = useState(contactData(dataContextState?.user))
  const [anotherAddress, setAnotherAddress] = useState(contactData(dataContextState?.user?.anotherAddress))
  const [firmInfo, setFirmInfo] = useState(firmData(dataContextState?.user?.firmInfo))

  const [pickupData, setPickupData] = useState(false)

  const [description, setDescription] = useState('')

  const [state, setState] = useState(stateObj)
  const [error, setError] = useState(errorObj)
  
  useEffect(() => {
    setBasketItems(dataContextState.basket)
    var newStartSum = 0
    dataContextState.basket.map(item => {
      newStartSum += +item.price * +item.count
    })
    setStartSum(newStartSum)
  }, [])

  useEffect(() => {
    if(deliveryData) {
      const combineData = getDeliveryData(deliveryData)
      const catlculateData = saleFrom(combineData, startSum)
      setDeliveryMethod(catlculateData)
    }
  }, [deliveryData])

  useEffect(() => {
    if(payData) {
      const combineData = getPayData(payData)
      const catlculateData = saleFrom(combineData, startSum)
      setPayMethod(catlculateData)
    }
  }, [payData])

  const calculateSale = () => {
    var newSum = startSum
    if(sale.type === 'procenta'){
      newSum = Math.round(newSum - (newSum * (sale.value / 100)))
    }else if(sale.type === 'castka'){
      newSum = newSum - sale.value
    }
    return newSum
  }

  useEffect(() => {
    if(sale.value){
      setSum(calculateSale())
    }
  }, [sale.value])

  useEffect(() => {
    setError({...error, deliveryMethod: false})
    if(!pickupData){
      deliveryMethod.map(item => {
        if(item.type === 'zasilkovna' && item.check){
          window.Packeta.Widget.pick('497b43a88a3af5e8', getPickup)
        }
      })
    }
    deliveryMethod.map(item => {
      if(item.check){
        setPaymentsAllow(item.paysAllow)
      }
    })
  }, [deliveryMethod])

  useEffect(() => {
    setError({...error, payMethod: false})
    payMethod.map(item => {
      if(item.check){
        setDeliveryAllow(item.deliveryAllow)
      }
    })
  }, [payMethod])

  useEffect(() => {
    const checkDelivery = deliveryMethod.filter(item => item.check)[0]
    const checkPayment = payMethod.filter(item => item.check)[0]
    let sum = 0
    if(sale.value) {
      sum = calculateSale()
    }else{
      sum = startSum
    }
    sum += +checkDelivery?.value || 0
    sum += +checkPayment?.value || 0
    setSum(sum)
  }, [deliveryMethod, payMethod])

  const onBlur = (type) => {
    if(validationForm(type, contactInfo, error, setError)) {
      return true
    }
    return false
  }

  const send = async () => {

    const newError = {...error}

    if(!contactInfo.address.length) newError.address = true
    if(!contactInfo.city.length) newError.city = true
    if(!contactInfo.surname.length) newError.surname = true
    if(!contactInfo.firstname.length) newError.firstname = true
    if(!contactInfo.phone.length) newError.phone = true
    if(!contactInfo.zip.length) newError.zip = true

    if(onBlur('email')) newError.email = true

    const checkDelivery = await deliveryMethod.filter(item => item.check)[0]
    const checkPayment = await payMethod.filter(item => item.check)[0]

    if(!checkDelivery) newError.deliveryMethod = true
    if(!checkPayment) newError.payMethod = true

    setError({...error, ...newError})

    if(Object.values(newError).indexOf(true) >= 0){
      return
    }

    if(!basketItems.length){
      window.location.href = '/'
      return
    }

    const dataSend = {
      publishedAt: new Date(),
      email: contactInfo.email,
      phone: contactInfo.phone,
      name: contactInfo.firstname,
      surname: contactInfo.surname,
      address: contactInfo.address,
      city: contactInfo.city,
      zip: contactInfo.zip,
      state: contactInfo.state,
      description,
      sum,
      payOnline: checkPayment.payOnline,
      status: "CREATED",
      delivery: {
        name: checkDelivery.label,
        value: checkDelivery.value,
        type: checkDelivery.method,
        guid: checkDelivery.guid,
        code: checkDelivery.code,
      },
      payment: {
        name: checkPayment.label,
        value: checkPayment.value,
        type: checkPayment.method,
        guid: checkPayment.guid,
        code: checkPayment.code,
      },
      basketItem: basketItems.map(item => ({
        variant: item.variantProduct,
        brand: item.brand,
        price: item.price,
        slug: item.slug,
        count: item.count,
        imageUrl: buildImageUrl(item.imageUrl),
        idProduct: item.id,
        title: item.title,
        guid: item.guid,
        code: item.code
      }))
    }

    if(sale.value > 0) {
      dataSend.sale = {
        type: sale.type === 'procent' ? '%' : "Kč",
        value: sale.value
      }
    }
    
    if(anotherAddress.email.length) {
      dataSend.anotherAddress = anotherAddress
    }

    if(firmInfo.ico.length) {
      dataSend.firmInfo = firmInfo
    }

    const dataOrder = await axios.post(`${APP_API}/api/orders?populate=*`, {data: dataSend}).catch(err => console.error('Err', err)) 

    if(dataSend.payOnline) {
      axios.post(`/api/payment`, {...dataOrder.data.data.attributes, id: dataOrder.data.data.id}).then(res => {
        window.location.href = res.data.gw_url
      }).catch(err => console.log(err))
    }else{
      window.location.href = `/dekujem/${btoa(dataOrder.data.data.id)}`
    }

  }

  const getPickup = (data) => {
    const deliveryArr = deliveryMethod
    if(data === null) {
      deliveryArr[deliveryArr.findIndex(item => item.type === 'zasilkovna')].check = false
    }else{
      deliveryArr[deliveryArr.findIndex(item => (item.type === 'zasilkovna' && item.state === radioState))].label = `Zasilkovna - ${data.name}`
    }
    
    setDeliveryMethod(deliveryArr)
    setPickupData(data)
  }

  return (
    <Checkout
      sum={sum}
      sale={sale}
      dataGl={dataGl}
      send={send}
      state={state}
      error={error}
      setSale={setSale}
      setError={setError}
      firmInfo={firmInfo}
      startSum={startSum}
      setState={setState}
      payMethod={payMethod}
      getPickup={getPickup}
      pickupData={pickupData}
      basketItems={basketItems}
      contactInfo={contactInfo}
      setFirmInfo={setFirmInfo}
      description={description}
      setPayMethod={setPayMethod}
      paymentAllow={paymentAllow}
      deliveryAllow={deliveryAllow}
      anotherAddress={anotherAddress}
      setContactInfo={setContactInfo}
      setDescription={setDescription}
      deliveryMethod={deliveryMethod}
      setRadioState={setRadioState}
      radioState={radioState}
      setPaymentsAllow={setPaymentsAllow}
      setDeliveryMethod={setDeliveryMethod}
      setAnotherAddress={setAnotherAddress}
    />
  )
}

export default CheckoutWrap
