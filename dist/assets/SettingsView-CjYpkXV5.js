import{d as u,e as a,c as i,w as m,A as p,o as b,a as o,f as n,v as d}from"./index-Dm5km34q.js";const v={class:"bg-white p-6 rounded shadow"},w=u({__name:"SettingsView",setup(c){const t=a("Makunudhoo School"),l=a("#4CAF50"),r=()=>{alert(`Settings saved!
School Name: ${t.value}
Theme Color: ${l.value}`)};return(f,e)=>(b(),i(p,null,{default:m(()=>[e[4]||(e[4]=o("h1",{class:"text-2xl font-bold mb-4"},"Admin Settings",-1)),o("div",v,[e[2]||(e[2]=o("label",{class:"block mb-2"},"School Name",-1)),n(o("input",{"onUpdate:modelValue":e[0]||(e[0]=s=>t.value=s),type:"text",class:"w-full border p-2 rounded mb-4"},null,512),[[d,t.value]]),e[3]||(e[3]=o("label",{class:"block mb-2"},"Theme Color",-1)),n(o("input",{"onUpdate:modelValue":e[1]||(e[1]=s=>l.value=s),type:"color",class:"w-full border p-2 rounded mb-4"},null,512),[[d,l.value]]),o("button",{onClick:r,class:"bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"}," Save Settings ")])]),_:1}))}});export{w as default};
