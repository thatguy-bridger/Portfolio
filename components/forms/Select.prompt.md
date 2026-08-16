Dropdown for template pick, font pick, section-type pick.

```jsx
<Select label="Layout" value={layout} onChange={e=>setLayout(e.target.value)} options={[{label:'Grid',value:'grid'},{label:'List',value:'list'}]} />
```
