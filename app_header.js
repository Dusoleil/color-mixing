export var app_header =
{
    data()
    {return{
        expand:true,
        target:"",
        input_delta:true,
        current:[0,0,0]
    }},
    created()
    {
        this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
    },
    computed:
    {
        colors()
        {
            return Object.keys(this.$store.state.color_map).map((id) => {return {"value":id,"title":this.$store.state.colors[id].name}});
        },
        delta_visibility()
        {
            return this.input_delta ? "visibility:visible" : "visibility:hidden";
        },
        delta_L_min()
        {
            return this.input_delta ? -100 : 0;
        },
        delta_min()
        {
            return this.input_delta ? -255 : -127;
        },
        delta_max()
        {
            return this.input_delta ? 255 : 128;
        },
        mobile_num_input()
        {
            return this.$vuetify.display.mobile ? 'hidden' : 'stacked';
        }
    },
    methods:
    {
        pick_colors(e)
        {
            this.$store.commit("load_color_file",e.target.files[0]);
        },
        use_linear(e)
        {
            this.$store.commit("set_linear",e.target.checked);
        }
    },
    watch:
    {
        async colors()
        {
            this.target = "";
            await this.$nextTick();
            this.target = this.colors[0].value;
        },
        target()
        {
            this.$store.commit("set_target",this.target);
            this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
        },
        current:
        {
            handler()
            {
                this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
            },
            deep:true
        },
        input_delta()
        {
            this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
        }
    },
    template:/*html*/`
        <v-sheet location="top left" position="sticky" elevation="5" rounded="b-xl" class="pa-3">
            <v-expand-transition><div v-show="!$vuetify.display.mobile || expand">
                <div class="ga-4" :class="$vuetify.display.mobile ? '' : 'd-flex'">
                    <v-file-input label="Colors File" accept=".json" @change="pick_colors"></v-file-input>
                    <div class="d-flex ga-4" :class="$vuetify.display.mobile ? '' : 'w-66'">
                    <v-select label="Target Color" :items="colors" v-model="target"></v-select>
                    <v-switch class="w-33" label="Use Linear Space" @change="use_linear" :model-value="true"></v-switch>
                    </div>
                </div>
                <div class="d-flex ga-4">
                    <v-number-input :control-variant="mobile_num_input" :label="(input_delta?'&Delta;':'')+'L'" :min="delta_L_min" :max="100" :step="0.01" :precision="2" v-model="current[0]"></v-number-input>
                    <v-number-input :control-variant="mobile_num_input" :label="(input_delta?'&Delta;':'')+'a'" :min="delta_min" :max="delta_max" :step="0.01" :precision="2" v-model="current[1]"></v-number-input>
                    <v-number-input :control-variant="mobile_num_input" :label="(input_delta?'&Delta;':'')+'b'" :min="delta_min" :max="delta_max" :step="0.01" :precision="2" v-model="current[2]"></v-number-input>
                    <v-switch label="Use Deltas" v-model="input_delta"></v-switch>
                </div>
            </div></v-expand-transition>
            <div v-if="$vuetify.display.mobile" @click="expand = !expand" class="d-flex justify-center"><v-icon :icon="expand?'mdi-chevron-up':'mdi-chevron-down'"></v-icon></div>
        </v-sheet>`
};
