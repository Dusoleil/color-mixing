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
            if(window.db)
            {
                const filestore = db.transaction("files", 'readwrite').objectStore("files");
                filestore.put(file,"colorfile");
            }
            var reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = (readerEvent) =>
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
    data()
    {return{
        page:0,
        open:false
    }},
    computed:
    {
        nav_main_size()
        {
            return this.$vuetify.display.mobile ? "default" : "large";
        },
        nav_dial_size()
        {
            return this.$vuetify.display.mobile ? "small" : "default";
        }
    },
    components:
    {
        "app-header":app_header,
        "color-pane":color_pane,
        "accuracy-check":accuracy_check
    },
    mounted()
    {
        if(window.db)
        {
            const request = db.transaction("files",'readonly').objectStore("files").get("colorfile");
            request.onsuccess = (e) =>
            {
                if(e.target.result)
                    this.$store.commit("load_color_file",e.target.result);
            }
        }
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
                    "background":"#221E1C",
                    "surface":"#161412",
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
            },
            light:
            {
                colors:
                {
                    "background":"#B6ABA5",
                    "surface":"#DAD5D2",
                    "surface-light":"#ECE1DA",
                    "surface-bright":"#723D46",
                    "surface-variant":"#472D30",
                    "primary":"#8D6868",
                    "primary-darken-1": "#815F5F",
                    "secondary":"#7D7364",
                    "secondary-darken-1":"#71685B",
                    "accent":"#35CE8D",
                    "on-surface":"#100A04",
                    "on-surface-light":"#100A04",
                    "on-surface-bright":"#100A04",
                    "on-primary":"#100A04",
                    "on-secondary":"#100A04",
                    "on-surface-variant":"#13161B",
                    "on-primary-darken-1":"#13161B",
                    "on-secondary-darken-1":"#13161B"

                },
                variables:
                {
                    "border-color":"#100A04"
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

window.onload = async function() {
    try
    {
        window.db = await new Promise((resolve,reject) =>
        {
            const dbrequest = window.indexedDB.open("db",1);
            dbrequest.onerror = (e)=>{reject(e.target.error);};
            dbrequest.onsuccess = (e)=>{resolve(e.target.result);};
            dbrequest.onupgradeneeded = (e) =>
            {
                const db = e.target.result;
                const filestore = db.createObjectStore("files");
            };
        });
    }
    catch(e)
    {
        console.error(`DB Error: ${e?.message}`);
    }
    app.mount("#app");
}
