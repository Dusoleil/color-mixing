import {createApp} from "vue"
import {createStore} from "vuex"
import {createVuetify,blueprints} from "vuetify"
import colors from "colors"
import {vec3} from "glMatrix"
import {Color} from "color"
import {app_header} from "app_header"
import {color_pane} from "color_pane"
import {accuracy_check} from "accuracy_check"

const store = createStore(
{
    state()
    {return{
        colors:null,
        color_map:{},
        current_color:null,
        target_color:null,
        comp_colors:[],
        use_linear:true
    }},
    mutations:
    {
        load_color_file(state,file)
        {
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = readerEvent =>
            {
                let obj = JSON.parse(readerEvent.target.result);
                state.colors = Object.values(obj.colors).reduce((acc,col) => {acc[col.id] = new Color(col.name,vec3.fromValues(col.L,col.a,col.b));return acc},{});
                state.color_map = Object.values(obj.targets).reduce((acc,tar) => {acc[tar.id] = tar.components;return acc},{});
            }
        },
        set_target(state,id)
        {
            if(id in state.colors)
            {
                state.target_color = state.colors[id];
                state.comp_colors = state.color_map[id].map((i) => state.colors[i]);
            }
            else
            {
                state.target_color = null;
                state.comp_colors = [];
            }
        },
        set_linear(state,use)
        {
            state.use_linear = use;
        },
        set_current(state,val)
        {
            let origin = vec3.create();
            if(val.delta && state.target_color) origin = vec3.clone(state.target_color.Lab);
            vec3.add(origin,origin,val.Lab);
            state.current_color = new Color("Current Color", origin);
        }
    }
})

const app = createApp(
{
    components:
    {
        "app-header":app_header,
        "color-pane":color_pane,
        "accuracy-check":accuracy_check
    }
});

const uix = createVuetify(
{
    theme:
    {
        defaultTheme:"dark",
        themes:
        {
            dark:
            {
                colors:
                {
                    "background":"#1C1917",
                    "surface":"#100E0D",
                    "surface-light":"#2D2825",
                    "surface-bright":"#5A4F49",
                    "surface-variant":"#B6ABA5",
                    "primary":"#5E4545",
                    "primary-darken-1": "#463434",
                    "secondary":"#665E52",
                    "secondary-darken-1":"#39342D",
                    "accent":"#35CE8D",
                    "on-surface":"#E9EBED",
                    "on-surface-light":"#E9EBED",
                    "on-surface-bright":"#E9EBED",
                    "on-primary":"#E9EBED",
                    "on-secondary":"#E9EBED",
                    "on-surface-variant":"#A19AAC",
                    "on-primary-darken-1":"#A19AAC",
                    "on-secondary-darken-1":"#A19AAC"

                },
                variables:
                {
                    "border-color":"#E9EBED"
                }
            }
        }
    },
    blueprint:blueprints.md3,
    display:
    {
        mobileBreakpoint:"sm"
    },
    defaults:
    {
        VMain:
        {
            class:["ma-auto","pa-auto"]
        },
        VNumberInput:
        {
            inset:true
        },
        VExpansionPanels:
        {
            static:true,
            multiple:true,
            variant:"accordion",
            class:["d-flex flex-column justify-center"]
        },
        VTable:
        {
            class:["border"],
            density:"compact",
            striped:"odd"
        }
    }
});

app.use(store);
app.use(uix);
app.mount("#app");
