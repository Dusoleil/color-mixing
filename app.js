import {createApp} from "vue"
import {createStore} from "vuex"
import {createVuetify,blueprints} from "vuetify"
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
    //blueprint:blueprints.md2
});

app.use(store);
app.use(uix);
app.mount("#app");
