import {createApp} from "vue"
import {createStore} from "vuex"
import {vec3} from "glMatrix"
import {Color} from "color"
import {app_header} from "app_header"

const store = createStore(
{
    state()
    {return{
        colors:null,
        comp_colors:null,
        current_color:null,
        target_color:null,
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
                state.colors = {};
                state.comp_colors = {};
                let obj = JSON.parse(readerEvent.target.result);
                for(let color of obj.colors)
                {
                    state.colors[color.id] = new Color(color.name,vec3.fromValues(color.L,color.a,color.b));
                }
                for(let target of obj.targets)
                {
                    state.comp_colors[target.id] = target.components;
                }
            }
        },
        set_target(state,id)
        {
            if(id in state.colors) state.target_color = state.colors[id];
        },
        set_linear(state,use)
        {
            state.use_linear = use;
        },
        set_current(state,val)
        {
            let origin = vec3.create();
            if(val.delta && state.target_color) origin = state.target_color.Lab;
            vec3.add(origin,origin,val.Lab);
            state.current_color = new Color("Current Color", origin);
        }
    }
})

const app = createApp(
{
    components:
    {
        "app-header":app_header
    }
});

app.use(store);
app.mount("#app");
