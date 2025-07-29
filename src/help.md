This document lists definitions of integers used in various models

# Offer
```
type: {
    0: service,
    1: offer (want to sell),
    2: demand (want to buy),
    3: auction
}
unit:{
    0: not available,
    1: kg,
    2: m3
}
status:{
    0: draft,
    1: available,
    2: sold,
    3: cancelled
}
cargoType:{
    0: no logistics needed,
    1: included in price,
    2: buyer arranges logistics
    3: agreed upon
}
visibility:{
    0: do not show,
    1: public,
    2: private
}
```
# Company
```
companyType:{
    0: Service Provider,
    1: Biogas plant (farm),
    2: Biogas plant,
    3: Biomass producer (farm),
    4: Biomass producer,
    5: Logistics,
    6: Energy sector
}

companyStatus:{
    0: unverified,
    1: verified
    2: disabled
}
```
# User
```
userlevel:{
    1: normal,
    2: premium,
    20: company member,
    21: premium company member,
    23: company admin/owner
    99: admin
}
```
# Location
```
type:{
    1: company location,
    2: offer location,
    3: logistics terminal,
    4: company map location
}
```

# Material
```
type:{
    0: unknown
    1: straw
    2: dung solid 
    3: dung liquid
    4: compressed biogas
    5: liquid biogas
    6: feedstock
    7: digestate / mädätysjäännös
    
}
```

# BlogPost
```
type:{
    0: unpublished
    1: published
    2: draft
    3: file  
}
```

# Files
```
type:{
    0: Company
    1: Offer
    2: Material
    3: User
}
```

# Logs
```
level:{
    0: debug
    1: normal
    2: warning
    3: error
    4: high
}