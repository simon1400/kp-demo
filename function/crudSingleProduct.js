import { AxiosSTRAPI } from "../restClient"

const crudSingleProduct = (data) => {
  data.map(item => {
    AxiosSTRAPI.get(`/api/produkties?filters[guid][$contains]=${item.guid}&publicationState=preview`).then(res => {
      if(res.data?.data?.length){
        AxiosSTRAPI.put('/api/produkties/'+res.data.data[0].id, {data: {
          price: item.price,
          stock: item.stock,
        }})
          .then(res => console.log('Success update --', res.data.data.attributes.title))
          .catch(err => console.error(err.response?.data || err.response))
  
      }else{
        AxiosSTRAPI.post('/api/produkties', {data: item})
          .then(res => console.log('Success created --', res.data?.data?.attributes?.title))
          .catch(err => {
            if(err.response?.data) {
              console.log('Failed created --', err.response.data)
            }else{
              console.log('Failed created --', err.response)
            }
          })
      }
    }).catch(err => console.log(err.response?.data || err.response))
  })
}

export default crudSingleProduct